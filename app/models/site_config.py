from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class SiteConfig(SQLModel, table=True):
    __tablename__ = "site_configs"

    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(unique=True, index=True)  # 配置键名
    value: str = Field(default="")  # 配置值 (JSON 字符串存储复杂数据)，可以为空
    category: str = Field(index=True)  # 分类: appearance, content, links
    description: str = ""  # 配置说明
    updated_at: datetime = Field(default_factory=datetime.utcnow)
