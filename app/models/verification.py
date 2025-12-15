from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from enum import Enum


class VerificationType(str, Enum):
    EMAIL_VERIFY = "email_verify"
    PASSWORD_RESET = "password_reset"


class VerificationCode(SQLModel, table=True):
    __tablename__ = "verification_codes"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    code: str = Field(index=True)  # UUID 或随机字符串
    type: VerificationType
    expires_at: datetime
    used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
