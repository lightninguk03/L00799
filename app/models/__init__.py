# 导入所有模型以确保表创建
from app.models.user import User
from app.models.post import Post
from app.models.category import Category
from app.models.comment import Comment
from app.models.interaction import Interaction, InteractionType
from app.models.notification import Notification, NotificationType
from app.models.chat import ChatMessage, MessageRole
from app.models.verification import VerificationCode, VerificationType
from app.models.refresh_token import RefreshToken
from app.models.follow import Follow
from app.models.admin_user import AdminUser, AdminRole
from app.models.site_config import SiteConfig
from app.models.media import Media

__all__ = [
    "User",
    "Post",
    "Category",
    "Comment",
    "Interaction",
    "InteractionType",
    "Notification",
    "NotificationType",
    "ChatMessage",
    "MessageRole",
    "VerificationCode",
    "VerificationType",
    "RefreshToken",
    "Follow",
    "AdminUser",
    "AdminRole",
    "SiteConfig",
    "Media",
]
