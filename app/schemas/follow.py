from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserBrief(BaseModel):
    """用户简要信息"""
    id: int
    username: str
    avatar: Optional[str] = None


class FollowResponse(BaseModel):
    """关注响应"""
    id: int
    follower_id: int
    following_id: int
    created_at: datetime


class UserProfileResponse(BaseModel):
    """用户个人主页响应"""
    id: int
    username: str
    email: str
    avatar: Optional[str] = None
    is_verified: bool = False
    created_at: datetime
    post_count: int = 0
    following_count: int = 0
    follower_count: int = 0
    is_following: bool = False  # 当前用户是否关注了此用户
