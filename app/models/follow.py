from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint


class Follow(SQLModel, table=True):
    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="unique_follow"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    follower_id: int = Field(foreign_key="users.id", index=True)  # 关注者
    following_id: int = Field(foreign_key="users.id", index=True)  # 被关注者
    created_at: datetime = Field(default_factory=datetime.utcnow)
