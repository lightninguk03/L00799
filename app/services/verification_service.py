import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlmodel import Session, select
from app.config import settings
from app.models.verification import VerificationCode, VerificationType
from app.models.user import User


def generate_verification_code() -> str:
    """生成随机验证码"""
    return secrets.token_urlsafe(32)


def create_verification_code(
    session: Session,
    user_id: int,
    code_type: VerificationType
) -> str:
    """创建验证码"""
    # 使旧的同类型验证码失效
    old_codes = session.exec(
        select(VerificationCode).where(
            VerificationCode.user_id == user_id,
            VerificationCode.type == code_type,
            VerificationCode.used == False
        )
    ).all()
    
    for old_code in old_codes:
        old_code.used = True
        session.add(old_code)
    
    # 计算过期时间
    if code_type == VerificationType.EMAIL_VERIFY:
        expire_hours = settings.EMAIL_VERIFY_EXPIRE_HOURS
    else:
        expire_hours = settings.PASSWORD_RESET_EXPIRE_HOURS
    
    expires_at = datetime.utcnow() + timedelta(hours=expire_hours)
    
    # 创建新验证码
    code = generate_verification_code()
    verification = VerificationCode(
        user_id=user_id,
        code=code,
        type=code_type,
        expires_at=expires_at
    )
    session.add(verification)
    
    return code


def verify_code(
    session: Session,
    code: str,
    code_type: VerificationType
) -> Tuple[bool, Optional[int], str]:
    """
    验证验证码
    
    返回: (是否有效, user_id, 错误码)
    """
    verification = session.exec(
        select(VerificationCode).where(
            VerificationCode.code == code,
            VerificationCode.type == code_type
        )
    ).first()
    
    if not verification:
        return False, None, "invalid_verification_code"
    
    if verification.used:
        return False, None, "verification_code_used"
    
    if verification.expires_at < datetime.utcnow():
        return False, None, "verification_code_expired"
    
    # 标记为已使用
    verification.used = True
    session.add(verification)
    
    return True, verification.user_id, ""


def mark_user_verified(session: Session, user_id: int) -> bool:
    """标记用户邮箱已验证"""
    user = session.get(User, user_id)
    if user:
        user.is_verified = True
        session.add(user)
        return True
    return False
