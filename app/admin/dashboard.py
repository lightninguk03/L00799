"""
自定义仪表盘视图
"""
from datetime import datetime
from sqladmin import BaseView, expose
from sqlmodel import Session, select, func
from starlette.requests import Request
from starlette.responses import HTMLResponse

from app.database import engine
from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment
from app.models.category import Category
from app.models.notification import Notification
from app.models.media import Media
from app.models.admin_user import AdminUser
from app.models.site_config import SiteConfig
from app.config import settings


class DashboardView(BaseView):
    name = "仪表盘"
    icon = "fa-solid fa-chart-line"
    
    def is_accessible(self, request: Request) -> bool:
        return request.session.get("admin_id") is not None
    
    @expose("/dashboard", methods=["GET"])
    async def dashboard(self, request: Request):
        admin_name = request.session.get("admin_username", "管理员")
        
        with Session(engine) as session:
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            
            stats = {
                "users": session.exec(select(func.count(User.id))).one(),
                "posts": session.exec(select(func.count(Post.id))).one(),
                "comments": session.exec(select(func.count(Comment.id))).one(),
                "categories": session.exec(select(func.count(Category.id))).one(),
                "media": session.exec(select(func.count(Media.id))).one(),
                "unread_notifications": session.exec(
                    select(func.count(Notification.id)).where(Notification.is_read == False)
                ).one(),
                "today_users": session.exec(
                    select(func.count(User.id)).where(User.created_at >= today)
                ).one(),
                "today_posts": session.exec(
                    select(func.count(Post.id)).where(Post.created_at >= today)
                ).one(),
                "admins": session.exec(select(func.count(AdminUser.id))).one(),
                "configs": session.exec(select(func.count(SiteConfig.id))).one(),
            }
            
            recent_users = session.exec(
                select(User).order_by(User.created_at.desc()).limit(5)
            ).all()
            
            recent_posts = session.exec(
                select(Post).order_by(Post.created_at.desc()).limit(5)
            ).all()
        
        html = generate_dashboard_html(admin_name, stats, recent_users, recent_posts)
        return HTMLResponse(content=html)


def generate_dashboard_html(admin_name, stats, recent_users, recent_posts):
    """生成仪表盘 HTML"""
    
    # 用户行
    user_rows = ""
    for user in recent_users:
        user_rows += f"""
        <tr>
            <td>{user.username}</td>
            <td>{user.email}</td>
            <td>{user.created_at.strftime('%m-%d %H:%M')}</td>
        </tr>
        """
    if not recent_users:
        user_rows = '<tr><td colspan="3" class="text-center text-muted py-3">暂无数据</td></tr>'
    
    # 动态行
    post_rows = ""
    for post in recent_posts:
        content = (post.content[:50] + "...") if post.content and len(post.content) > 50 else (post.content or "")
        post_rows += f"""
        <tr>
            <td><div class="text-truncate" style="max-width:200px">{content}</div></td>
            <td>{post.user_id}</td>
            <td>{post.created_at.strftime('%m-%d %H:%M')}</td>
        </tr>
        """
    if not recent_posts:
        post_rows = '<tr><td colspan="3" class="text-center text-muted py-3">暂无数据</td></tr>'

    return f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>仪表盘 - Project Neon 管理后台</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {{ background: #f8f9fa; }}
        .sidebar {{ width: 250px; min-height: 100vh; background: #2c3e50; }}
        .sidebar a {{ color: rgba(255,255,255,0.8); text-decoration: none; padding: 12px 20px; display: block; }}
        .sidebar a:hover, .sidebar a.active {{ background: rgba(255,255,255,0.1); color: #fff; }}
        .main-content {{ margin-left: 250px; padding: 20px; }}
        .stat-card {{ border-left: 4px solid; }}
        .stat-card:hover {{ transform: translateY(-2px); transition: 0.2s; }}
    </style>
</head>
<body>
    <div class="d-flex">
        <!-- 侧边栏 -->
        <div class="sidebar position-fixed">
            <div class="p-3 text-white">
                <h5><i class="fa-solid fa-bolt me-2"></i>Project Neon</h5>
            </div>
            <nav>
                <a href="/admin/dashboard" class="active"><i class="fa-solid fa-chart-line me-2"></i>仪表盘</a>
                <a href="/admin/reports"><i class="fa-solid fa-chart-bar me-2"></i>数据报表</a>
                <hr class="mx-3 border-secondary">
                <a href="/admin/user/list"><i class="fa-solid fa-user me-2"></i>用户管理</a>
                <a href="/admin/post/list"><i class="fa-solid fa-newspaper me-2"></i>动态管理</a>
                <a href="/admin/category/list"><i class="fa-solid fa-folder me-2"></i>分类管理</a>
                <a href="/admin/comment/list"><i class="fa-solid fa-comment me-2"></i>评论管理</a>
                <a href="/admin/notification/list"><i class="fa-solid fa-bell me-2"></i>通知管理</a>
                <a href="/admin/site-config/list"><i class="fa-solid fa-cog me-2"></i>网站配置</a>
                <a href="/admin/media/list"><i class="fa-solid fa-images me-2"></i>媒体库</a>
                <a href="/admin/admin-user/list"><i class="fa-solid fa-user-shield me-2"></i>管理员</a>
                <hr class="mx-3 border-secondary">
                <a href="/admin/logout"><i class="fa-solid fa-sign-out-alt me-2"></i>退出登录</a>
            </nav>
        </div>
        
        <!-- 主内容 -->
        <div class="main-content flex-grow-1">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2><i class="fa-solid fa-chart-line me-2"></i>仪表盘</h2>
                    <p class="text-muted mb-0">欢迎回来，{admin_name}！</p>
                </div>
            </div>
            
            <!-- 统计卡片 -->
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6 mb-3">
                    <div class="card stat-card border-0 shadow-sm" style="border-color: #4e73df;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="text-muted small text-uppercase">用户总数</div>
                                    <div class="h3 mb-0 text-primary">{stats['users']}</div>
                                </div>
                                <i class="fa-solid fa-users fa-2x text-muted"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-3">
                    <div class="card stat-card border-0 shadow-sm" style="border-color: #1cc88a;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="text-muted small text-uppercase">动态总数</div>
                                    <div class="h3 mb-0 text-success">{stats['posts']}</div>
                                </div>
                                <i class="fa-solid fa-newspaper fa-2x text-muted"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-3">
                    <div class="card stat-card border-0 shadow-sm" style="border-color: #36b9cc;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="text-muted small text-uppercase">评论总数</div>
                                    <div class="h3 mb-0 text-info">{stats['comments']}</div>
                                </div>
                                <i class="fa-solid fa-comments fa-2x text-muted"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-3">
                    <div class="card stat-card border-0 shadow-sm" style="border-color: #f6c23e;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="text-muted small text-uppercase">分类数量</div>
                                    <div class="h3 mb-0 text-warning">{stats['categories']}</div>
                                </div>
                                <i class="fa-solid fa-folder fa-2x text-muted"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 第二行统计 -->
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6 mb-3">
                    <div class="card stat-card border-0 shadow-sm" style="border-color: #e74a3b;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="text-muted small text-uppercase">媒体文件</div>
                                    <div class="h3 mb-0 text-danger">{stats['media']}</div>
                                </div>
                                <i class="fa-solid fa-images fa-2x text-muted"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-3">
                    <div class="card stat-card border-0 shadow-sm" style="border-color: #858796;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="text-muted small text-uppercase">未读通知</div>
                                    <div class="h3 mb-0 text-secondary">{stats['unread_notifications']}</div>
                                </div>
                                <i class="fa-solid fa-bell fa-2x text-muted"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-3">
                    <div class="card stat-card border-0 shadow-sm" style="border-color: #5a5c69;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="text-muted small text-uppercase">今日新用户</div>
                                    <div class="h3 mb-0">{stats['today_users']}</div>
                                </div>
                                <i class="fa-solid fa-user-plus fa-2x text-muted"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-3">
                    <div class="card stat-card border-0 shadow-sm" style="border-color: #6f42c1;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="text-muted small text-uppercase">今日动态</div>
                                    <div class="h3 mb-0" style="color:#6f42c1">{stats['today_posts']}</div>
                                </div>
                                <i class="fa-solid fa-plus-circle fa-2x text-muted"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 最近数据 -->
            <div class="row">
                <div class="col-xl-6 mb-4">
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-white py-3">
                            <h6 class="m-0 text-primary"><i class="fa-solid fa-user-clock me-2"></i>最近注册用户</h6>
                        </div>
                        <div class="card-body p-0">
                            <table class="table table-hover mb-0">
                                <thead class="table-light">
                                    <tr><th>用户名</th><th>邮箱</th><th>注册时间</th></tr>
                                </thead>
                                <tbody>{user_rows}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-xl-6 mb-4">
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-white py-3">
                            <h6 class="m-0 text-success"><i class="fa-solid fa-newspaper me-2"></i>最近发布动态</h6>
                        </div>
                        <div class="card-body p-0">
                            <table class="table table-hover mb-0">
                                <thead class="table-light">
                                    <tr><th>内容</th><th>用户ID</th><th>发布时间</th></tr>
                                </thead>
                                <tbody>{post_rows}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 系统信息 -->
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white py-3">
                    <h6 class="m-0 text-secondary"><i class="fa-solid fa-server me-2"></i>系统信息</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <p><strong>应用名称：</strong>{settings.APP_NAME}</p>
                            <p><strong>版本：</strong>{settings.VERSION}</p>
                        </div>
                        <div class="col-md-4">
                            <p><strong>数据库：</strong>SQLite</p>
                            <p><strong>框架：</strong>FastAPI + SQLAdmin</p>
                        </div>
                        <div class="col-md-4">
                            <p><strong>管理员数量：</strong>{stats['admins']}</p>
                            <p><strong>配置项数量：</strong>{stats['configs']}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
"""
