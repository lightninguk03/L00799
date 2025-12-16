from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
from app.config import settings
from app.database import create_db_and_tables
from app.api.v1 import auth, posts, gallery, ai, system, notifications, search, users, admin_views, banners
from app.core.exceptions import APIException
from app.core.rate_limit import limiter

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# 添加限流器
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session 中间件 (SQLAdmin 需要)
app.add_middleware(
    SessionMiddleware, 
    secret_key=settings.SECRET_KEY,
    same_site="lax",
    https_only=False,  # 本地开发使用 HTTP
    max_age=14 * 24 * 60 * 60,  # 14 天
)

# 管理后台自定义视图（仪表盘、报表）- 使用独立路径避免与 SQLAdmin 冲突
app.include_router(admin_views.router, prefix="/admin-api", tags=["管理后台"])

# 挂载管理后台 (SQLAdmin)
from app.admin import setup_admin
setup_admin(app)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router, prefix="/auth", tags=["认证"])
app.include_router(posts.router, prefix="/posts", tags=["动态"])
app.include_router(gallery.router, prefix="/gallery", tags=["图片"])
app.include_router(ai.router, prefix="/ai", tags=["AI助手"])
app.include_router(system.router, prefix="/system", tags=["系统"])
app.include_router(notifications.router, prefix="/notifications", tags=["通知"])
app.include_router(search.router, prefix="/search", tags=["搜索"])
app.include_router(users.router, prefix="/users", tags=["用户"])
app.include_router(banners.router, prefix="/banners", tags=["轮播图"])

@app.get("/")
def root():
    return {"message": "Welcome to Project Neon API V2.0", "docs": "/docs"}


