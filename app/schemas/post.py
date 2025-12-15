from pydantic import BaseModel, Field
from datetime import datetime
from app.models.post import MediaType

class PostCreate(BaseModel):
    content: str = Field(..., max_length=5000)
    category_id: int | None = None

class UserInfo(BaseModel):
    id: int
    username: str
    avatar: str | None

class PostResponse(BaseModel):
    id: int
    user_id: int
    content: str
    media_type: MediaType
    media_urls: list[str] = []  # 改为数组类型
    category_id: int | None
    repost_source_id: int | None
    created_at: datetime
    like_count: int = 0
    comment_count: int = 0
    view_count: int = 0
    is_liked: bool = False
    is_collected: bool = False
    user: UserInfo | None = None

class InteractRequest(BaseModel):
    interaction_type: str

class CommentCreate(BaseModel):
    content: str = Field(..., max_length=2000)

class CommentResponse(BaseModel):
    id: int
    user_id: int
    post_id: int
    content: str
    created_at: datetime
