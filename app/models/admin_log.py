"""
管理员操作日志模型
"""
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from enum import Enum


class AdminAction(str, Enum):
    """操作类型"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    BAN = "ban"
    UNBAN = "unban"
    LOGIN = "login"
    LOGOUT = "logout"
    EXPORT = "export"


class AdminLog(SQLModel, table=True):
    __tablename__ = "admin_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    admin_id: int = Field(index=True)  # 操作管理员 ID
    admin_username: str  # 管理员用户名（冗余存储，方便查询）
    action: str = Field(index=True)  # 操作类型
    target_type: str = Field(index=True)  # 目标类型: user/post/comment/config
    target_id: Optional[int] = None  # 目标 ID
    target_name: Optional[str] = None  # 目标名称（如用户名）
    details: Optional[str] = None  # 详细信息 (JSON)
    ip_address: Optional[str] = None  # IP 地址
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
