from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from enum import Enum

class MediaType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"

class Post(SQLModel, table=True):
    __tablename__ = "posts"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    content: str
    media_type: MediaType = Field(default=MediaType.TEXT)
    media_urls: Optional[str] = None
    category_id: Optional[int] = Field(default=None, foreign_key="categories.id", index=True)
    repost_source_id: Optional[int] = Field(default=None, foreign_key="posts.id")
    view_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: Optional[datetime] = None
