from sqlmodel import SQLModel, create_engine, Session
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    connect_args={"check_same_thread": False}
)

def create_db_and_tables():
    # 导入所有模型确保表被创建
    from app.models.user import User
    from app.models.post import Post
    from app.models.category import Category
    from app.models.comment import Comment
    from app.models.interaction import Interaction
    from app.models.chat import ChatMessage
    from app.models.notification import Notification
    from app.models.follow import Follow
    from app.models.verification import VerificationCode
    from app.models.refresh_token import RefreshToken
    from app.models.admin_user import AdminUser
    from app.models.site_config import SiteConfig
    from app.models.media import Media
    from app.models.admin_log import AdminLog  # 新增
    
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
