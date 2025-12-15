from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from enum import Enum


class AdminRole(str, Enum):
    SUPER_ADMIN = "super_admin"  # 超级管理员
    OPERATOR = "operator"        # 运营人员


class AdminUser(SQLModel, table=True):
    __tablename__ = "admin_users"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    role: AdminRole = Field(default=AdminRole.OPERATOR)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
