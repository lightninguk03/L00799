"""
SQLAdmin 管理后台配置
"""
import os
from datetime import datetime, timedelta, timezone
from sqladmin import Admin, ModelView
from starlette.requests import Request
from app.database import engine
from app.admin.auth import AdminAuth
from app.admin.dashboard import DashboardView
from app.admin.reports import ReportsView
from app.admin.help import HelpView


# 北京时区 UTC+8
BEIJING_TZ = timezone(timedelta(hours=8))


def format_datetime_beijing(model, attribute):
    """将 UTC 时间转换为北京时间显示"""
    # 兼容 attribute 可能是字符串或对象的情况
    if isinstance(attribute, str):
        attr_key = attribute
    else:
        attr_key = getattr(attribute, 'key', str(attribute))
    
    value = getattr(model, attr_key, None)
    if value is None:
        return "-"
    
    # 如果不是 datetime 类型，直接返回
    if not isinstance(value, datetime):
        return str(value) if value else "-"
    
    # 如果是 naive datetime，假设是 UTC
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    
    # 转换为北京时间
    beijing_time = value.astimezone(BEIJING_TZ)
    return beijing_time.strftime("%Y-%m-%d %H:%M:%S")

# 导入所有模型
from app.models.user import User
from app.models.post import Post
# from app.models.category import Category  # 已移除番剧分类功能
from app.models.comment import Comment
from app.models.notification import Notification
from app.models.admin_user import AdminUser, AdminRole
from app.models.site_config import SiteConfig
from app.models.media import Media
from app.models.admin_log import AdminLog


def is_super_admin(request: Request) -> bool:
    """检查当前用户是否是超级管理员"""
    return request.session.get("admin_role") == AdminRole.SUPER_ADMIN.value


# ==================== 用户管理 ====================
class UserAdmin(ModelView, model=User):
    name = "用户"
    name_plural = "用户管理"
    icon = "fa-solid fa-user"
    
    column_list = [User.id, User.username, User.email, User.avatar, User.is_verified, User.is_banned, User.created_at]
    column_searchable_list = [User.username, User.email]
    column_sortable_list = [User.id, User.username, User.created_at, User.is_banned]
    column_default_sort = [("created_at", True)]
    
    # 封禁相关字段可编辑
    form_excluded_columns = ["password_hash", "posts", "comments", "interactions", "notifications"]
    
    # 所有字段的中文标签
    column_labels = {
        User.id: "ID",
        User.username: "用户名",
        User.email: "邮箱",
        User.avatar: "头像",
        User.is_verified: "邮箱已验证",
        User.is_banned: "已封禁",
        User.ban_reason: "封禁原因",
        User.banned_until: "封禁截止时间",
        User.created_at: "注册时间",
    }
    
    # 时间格式化为北京时间
    column_formatters = {
        User.created_at: format_datetime_beijing,
        User.banned_until: format_datetime_beijing,
    }
    
    # 字段描述（表单中显示）
    form_args = {
        "username": {"description": "用户的显示名称"},
        "email": {"description": "用户的登录邮箱，不可修改"},
        "avatar": {"description": "头像图片URL，如 /uploads/avatars/xxx.jpg"},
        "is_verified": {"description": "用户是否已通过邮箱验证"},
        "is_banned": {"description": "勾选后用户将无法登录和使用任何功能"},
        "ban_reason": {"description": "封禁原因，会显示给用户"},
        "banned_until": {"description": "临时封禁的截止时间，留空表示永久封禁"},
    }
    
    can_create = False  # 用户只能通过前端注册
    can_delete = False  # 默认禁止删除


# ==================== 动态管理 ====================
class PostAdmin(ModelView, model=Post):
    name = "动态"
    name_plural = "动态管理"
    icon = "fa-solid fa-newspaper"
    
    column_list = [Post.id, Post.user_id, Post.content, Post.media_type, Post.category_id, Post.view_count, Post.created_at]
    column_searchable_list = [Post.content]
    column_sortable_list = [Post.id, Post.created_at, Post.view_count]
    column_default_sort = [("created_at", True)]
    
    form_excluded_columns = ["comments", "interactions"]
    
    column_labels = {
        Post.id: "ID",
        Post.user_id: "发布者ID",
        Post.content: "内容",
        Post.media_type: "媒体类型",
        Post.media_urls: "媒体链接",
        Post.category_id: "分类ID",
        Post.repost_source_id: "转发源ID",
        Post.view_count: "浏览量",
        Post.created_at: "发布时间",
    }
    
    # 时间格式化为北京时间
    column_formatters = {
        Post.created_at: format_datetime_beijing,
    }
    
    form_args = {
        "content": {"description": "动态的文字内容"},
        "media_type": {"description": "媒体类型：text=纯文本, image=图片, video=视频"},
        "media_urls": {"description": "媒体文件URL列表，JSON数组格式"},
        "category_id": {"description": "关联的番剧分类ID"},
        "view_count": {"description": "浏览次数"},
    }
    
    can_create = False  # 动态只能通过前端创建


# ==================== 评论管理 ====================
class CommentAdmin(ModelView, model=Comment):
    name = "评论"
    name_plural = "评论管理"
    icon = "fa-solid fa-comment"
    
    column_list = [Comment.id, Comment.user_id, Comment.post_id, Comment.content, Comment.created_at]
    column_searchable_list = [Comment.content]
    column_sortable_list = [Comment.id, Comment.created_at]
    column_default_sort = [("created_at", True)]
    
    column_labels = {
        Comment.id: "ID",
        Comment.user_id: "评论者ID",
        Comment.post_id: "动态ID",
        Comment.content: "评论内容",
        Comment.created_at: "评论时间",
    }
    
    # 时间格式化为北京时间
    column_formatters = {
        Comment.created_at: format_datetime_beijing,
    }
    
    can_create = False  # 评论只能通过前端创建


# ==================== 通知管理 ====================
class NotificationAdmin(ModelView, model=Notification):
    name = "通知"
    name_plural = "通知管理"
    icon = "fa-solid fa-bell"
    
    column_list = [Notification.id, Notification.user_id, Notification.type, Notification.is_read, Notification.created_at]
    column_sortable_list = [Notification.id, Notification.created_at, Notification.is_read]
    column_default_sort = [("created_at", True)]
    
    column_labels = {
        Notification.id: "ID",
        Notification.user_id: "接收者ID",
        Notification.actor_id: "触发者ID",
        Notification.type: "通知类型",
        Notification.post_id: "相关动态ID",
        Notification.is_read: "已读",
        Notification.created_at: "通知时间",
    }
    
    # 时间格式化为北京时间
    column_formatters = {
        Notification.created_at: format_datetime_beijing,
    }
    
    can_create = False  # 通知由系统自动创建


# ==================== 管理员管理 (仅超级管理员可见) ====================
class AdminUserAdmin(ModelView, model=AdminUser):
    name = "管理员"
    name_plural = "管理员管理"
    icon = "fa-solid fa-user-shield"
    identity = "adminuser"  # 明确指定 URL 标识
    
    column_list = [AdminUser.id, AdminUser.username, AdminUser.role, AdminUser.is_active, AdminUser.last_login, AdminUser.created_at]
    column_sortable_list = [AdminUser.id, AdminUser.created_at, AdminUser.last_login]
    column_default_sort = [("created_at", True)]
    
    form_excluded_columns = ["password_hash", "last_login", "created_at"]
    
    # 添加密码字段
    form_include_pk = False
    form_extra_fields = {
        "password": "密码（新建时必填，编辑时留空则不修改）"
    }
    
    column_labels = {
        AdminUser.id: "ID",
        AdminUser.username: "管理员账号",
        AdminUser.role: "角色",
        AdminUser.is_active: "启用状态",
        AdminUser.last_login: "最后登录",
        AdminUser.created_at: "创建时间",
    }
    
    # 时间格式化为北京时间
    column_formatters = {
        AdminUser.last_login: format_datetime_beijing,
        AdminUser.created_at: format_datetime_beijing,
    }
    
    form_args = {
        "username": {"description": "管理员登录账号"},
        "role": {"description": "super_admin=超级管理员(所有权限), operator=运营人员(基础权限)"},
        "is_active": {"description": "取消勾选后该管理员将无法登录后台"},
    }
    
    def is_accessible(self, request: Request) -> bool:
        """只有超级管理员可以访问"""
        return is_super_admin(request)
    
    async def on_model_change(self, data: dict, model: AdminUser, is_created: bool, request: Request):
        """创建或更新时处理密码"""
        from app.core.security import hash_password
        
        password = data.get("password")
        if password:
            # 有密码则加密
            model.password_hash = hash_password(password)
        elif is_created:
            # 新建时必须有密码，设置默认密码
            model.password_hash = hash_password("Admin123")
    
    async def scaffold_form(self, form_rules=None):
        """添加密码字段到表单"""
        from wtforms import StringField, PasswordField
        from wtforms.validators import Optional
        
        form = await super().scaffold_form(form_rules)
        form.password = PasswordField(
            "密码",
            validators=[Optional()],
            description="新建时必填，编辑时留空则不修改密码"
        )
        return form


# ==================== 网站配置 ====================
class SiteConfigAdmin(ModelView, model=SiteConfig):
    name = "配置"
    name_plural = "网站配置"
    icon = "fa-solid fa-cog"
    identity = "siteconfig"  # 明确指定 URL 标识
    
    column_list = [SiteConfig.id, SiteConfig.key, SiteConfig.value, SiteConfig.category, SiteConfig.description, SiteConfig.updated_at]
    column_searchable_list = [SiteConfig.key, SiteConfig.description]
    column_sortable_list = [SiteConfig.id, SiteConfig.category, SiteConfig.updated_at]
    column_default_sort = [("category", False)]
    
    column_labels = {
        SiteConfig.id: "ID",
        SiteConfig.key: "配置项",
        SiteConfig.value: "配置值",
        SiteConfig.category: "分类",
        SiteConfig.description: "说明",
        SiteConfig.updated_at: "更新时间",
    }
    
    form_args = {
        "key": {"description": "配置项的唯一标识，如 site_name"},
        "value": {"description": "配置的值，JSON格式的数组/对象需要用双引号。可以留空"},
        "category": {"description": "配置分类：brand=品牌信息, ai=AI助手, visual=视觉资源, content=首页内容, social=社交链接, features=功能开关"},
        "description": {"description": "配置项的中文说明"},
    }
    
    # 限制配置值列的显示，防止长文本撑开页面 + 时间格式化
    column_formatters = {
        SiteConfig.value: lambda m, a: (m.value[:50] + "...") if m.value and len(m.value) > 50 else m.value,
        SiteConfig.updated_at: format_datetime_beijing,
    }


# ==================== 媒体库 ====================
def format_media_preview(model, attribute):
    """格式化媒体预览，显示缩略图"""
    from markupsafe import Markup
    if model.file_type and model.file_type.startswith("image"):
        # 图片类型，显示缩略图 - 使用 file_path 字段
        url = model.file_path  # 已经是完整路径如 /uploads/images/xxx.png
        return Markup(f'<img src="{url}" style="max-width:80px;max-height:60px;border-radius:4px;cursor:pointer;" onclick="window.open(\'{url}\', \'_blank\')" title="点击查看大图">')
    elif model.file_type and model.file_type.startswith("video"):
        # 视频类型，显示图标
        return Markup('<i class="fa-solid fa-video" style="font-size:24px;color:#6c757d;"></i>')
    return "-"


def format_file_size(model, attribute):
    """格式化文件大小为可读格式"""
    size = model.file_size
    if size < 1024:
        return f"{size} B"
    elif size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"
    else:
        return f"{size / (1024 * 1024):.1f} MB"


class MediaAdmin(ModelView, model=Media):
    name = "媒体"
    name_plural = "媒体库"
    icon = "fa-solid fa-images"
    
    column_list = ["preview", Media.id, Media.original_name, Media.file_type, Media.file_size, Media.created_at]
    column_sortable_list = [Media.id, Media.created_at, Media.file_size]
    column_default_sort = [("created_at", True)]
    
    column_labels = {
        "preview": "预览",
        Media.id: "ID",
        Media.original_name: "原始文件名",
        Media.filename: "存储文件名",
        Media.file_path: "文件路径",
        Media.file_type: "文件类型",
        Media.file_size: "文件大小",
        Media.width: "宽度",
        Media.height: "高度",
        Media.uploaded_by: "上传者ID",
        Media.created_at: "上传时间",
    }
    
    # 添加图片预览、文件大小格式化和时间格式化
    column_formatters = {
        "preview": format_media_preview,
        Media.file_size: format_file_size,
        Media.created_at: format_datetime_beijing,
    }
    
    form_args = {
        "original_name": {"description": "用户上传时的原始文件名"},
        "filename": {"description": "服务器存储的文件名(UUID格式)"},
        "file_path": {"description": "文件在服务器上的完整路径"},
        "file_type": {"description": "文件MIME类型，如 image/jpeg"},
        "file_size": {"description": "文件大小，单位为字节"},
    }


# ==================== 操作日志 ====================
class AdminLogAdmin(ModelView, model=AdminLog):
    name = "日志"
    name_plural = "操作日志"
    icon = "fa-solid fa-history"
    
    column_list = [AdminLog.id, AdminLog.admin_username, AdminLog.action, AdminLog.target_type, 
                   AdminLog.target_name, AdminLog.ip_address, AdminLog.created_at]
    column_searchable_list = [AdminLog.admin_username, AdminLog.target_name, AdminLog.action]
    column_sortable_list = [AdminLog.id, AdminLog.created_at, AdminLog.action]
    column_default_sort = [("created_at", True)]
    
    column_labels = {
        AdminLog.admin_username: "操作人",
        AdminLog.action: "操作",
        AdminLog.target_type: "目标类型",
        AdminLog.target_name: "目标",
        AdminLog.ip_address: "IP地址",
        AdminLog.created_at: "时间",
    }
    
    # 时间格式化为北京时间
    column_formatters = {
        AdminLog.created_at: format_datetime_beijing,
    }
    
    can_create = False  # 日志只能由系统创建
    can_edit = False    # 日志不可编辑
    can_delete = False  # 日志不可删除
    
    def is_accessible(self, request: Request) -> bool:
        """只有超级管理员可以查看日志"""
        return is_super_admin(request)


def setup_admin(app):
    """设置并挂载 Admin 到 FastAPI 应用"""
    from app.config import settings
    authentication_backend = AdminAuth(secret_key=settings.SECRET_KEY)
    
    admin = Admin(
        app,
        engine,
        title="Project Neon 管理后台",
        authentication_backend=authentication_backend,
    )
    
    # 注册仪表盘、报表和帮助视图（放在最前面）
    admin.add_view(DashboardView)
    admin.add_view(ReportsView)
    admin.add_view(HelpView)
    
    # 注册所有数据视图
    admin.add_view(UserAdmin)
    admin.add_view(PostAdmin)
    # admin.add_view(CategoryAdmin)  # 已移除番剧分类功能
    admin.add_view(CommentAdmin)
    admin.add_view(NotificationAdmin)
    admin.add_view(SiteConfigAdmin)
    admin.add_view(MediaAdmin)
    admin.add_view(AdminUserAdmin)
    admin.add_view(AdminLogAdmin)
    
    return admin
