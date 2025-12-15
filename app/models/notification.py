from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from enum import Enum

class NotificationType(str, Enum):
    LIKE = "like"
    COMMENT = "comment"
    FOLLOW = "follow"
    REPOST = "repost"

class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    actor_id: int = Field(foreign_key="users.id")
    type: NotificationType
    post_id: Optional[int] = Field(default=None, foreign_key="posts.id")
    is_read: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
