from datetime import datetime
from typing import Optional
from fastapi import Depends, Header
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlmodel import Session
from app.config import settings
from app.database import get_session
from app.models.user import User
from app.core.exceptions import APIException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise APIException(401, "unauthorized")

    user = session.get(User, user_id)
    if not user:
        raise APIException(401, "user_not_found")
    
    # 检查用户是否被封禁
    if user.is_banned:
        # 检查是否是临时封禁且已过期
        if user.banned_until and user.banned_until < datetime.utcnow():
            # 自动解封
            user.is_banned = False
            user.ban_reason = None
            user.banned_until = None
            session.add(user)
            session.commit()
        else:
            # 仍在封禁期
            raise APIException(403, "user_banned", {
                "reason": user.ban_reason,
                "until": user.banned_until.isoformat() if user.banned_until else None
            })
    
    return user


async def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme_optional),
    session: Session = Depends(get_session)
) -> User | None:
    """可选的用户认证，未登录返回 None"""
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        return None

    user = session.get(User, user_id)
    if not user:
        return None
    
    # 被封禁用户也返回 None（不影响公开接口）
    if user.is_banned:
        if user.banned_until and user.banned_until < datetime.utcnow():
            user.is_banned = False
            user.ban_reason = None
            user.banned_until = None
            session.add(user)
            session.commit()
        else:
            return None
    
    return user
