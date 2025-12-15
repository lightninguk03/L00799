from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    avatar: str | None
    is_verified: bool = False
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
