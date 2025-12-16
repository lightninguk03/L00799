from datetime import datetime, timedelta
import secrets
from typing import Optional
from passlib.context import CryptContext
from jose import jwt
from sqlmodel import Session, select
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int) -> str:
    """创建 Access Token (短期)"""
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token_value() -> str:
    """生成 Refresh Token 值"""
    return secrets.token_urlsafe(32)


def store_refresh_token(session: Session, user_id: int, token: str) -> None:
    """存储 Refresh Token 到数据库"""
    from app.models.refresh_token import RefreshToken
    
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db_token = RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    session.add(db_token)


def create_tokens(session: Session, user_id: int) -> dict:
    """创建 Access Token 和 Refresh Token"""
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token_value()
    store_refresh_token(session, user_id, refresh_token)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


def verify_refresh_token(session: Session, token: str) -> Optional[int]:
    """验证 Refresh Token，返回 user_id"""
    from app.models.refresh_token import RefreshToken
    
    db_token = session.exec(
        select(RefreshToken).where(
            RefreshToken.token == token,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.utcnow()
        )
    ).first()
    
    if not db_token:
        return None
    
    return db_token.user_id


def revoke_refresh_token(session: Session, token: str) -> bool:
    """撤销单个 Refresh Token"""
    from app.models.refresh_token import RefreshToken
    
    db_token = session.exec(
        select(RefreshToken).where(RefreshToken.token == token)
    ).first()
    
    if db_token:
        db_token.revoked = True
        session.add(db_token)
        return True
    return False


def revoke_user_tokens(session: Session, user_id: int) -> int:
    """撤销用户的所有 Refresh Token"""
    from app.models.refresh_token import RefreshToken
    
    tokens = session.exec(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False
        )
    ).all()
    
    count = 0
    for token in tokens:
        token.revoked = True
        session.add(token)
        count += 1
    
    return count
