from pydantic import BaseModel
from datetime import datetime
from app.models.notification import NotificationType

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    actor_id: int
    actor_username: str
    actor_avatar: str | None
    type: NotificationType
    post_id: int | None
    is_read: bool
    created_at: datetime
