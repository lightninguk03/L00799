from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Media(SQLModel, table=True):
    __tablename__ = "media"

    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str  # 存储文件名
    original_name: str  # 原始文件名
    file_path: str  # 文件路径
    file_type: str  # 文件类型 (image/video)
    file_size: int  # 文件大小 (bytes)
    width: Optional[int] = None  # 图片宽度
    height: Optional[int] = None  # 图片高度
    uploaded_by: Optional[int] = Field(default=None, foreign_key="admin_users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
