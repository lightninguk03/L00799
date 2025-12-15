from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Comment(SQLModel, table=True):
    __tablename__ = "comments"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    post_id: int = Field(foreign_key="posts.id", index=True)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
