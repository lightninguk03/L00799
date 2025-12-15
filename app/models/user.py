from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    avatar: Optional[str] = None
    is_verified: bool = Field(default=False)  # 邮箱是否验证
    is_banned: bool = Field(default=False)  # 是否被封禁
    ban_reason: Optional[str] = None  # 封禁原因
    banned_until: Optional[datetime] = None  # 封禁截止时间 (None=永久)
    created_at: datetime = Field(default_factory=datetime.utcnow)
