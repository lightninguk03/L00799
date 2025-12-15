from fastapi import APIRouter, Depends, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select, func
from pydantic import BaseModel
from app.database import get_session
from app.dependencies import get_current_user
from app.models.user import User
from app.models.post import Post
from app.models.interaction import Interaction, InteractionType
from app.models.comment import Comment
from app.schemas.user import UserRegister, UserResponse, Token
from app.core.security import (
    hash_password, verify_password, create_tokens,
    verify_refresh_token, revoke_refresh_token, revoke_user_tokens
)
from app.core.exceptions import APIException
from app.utils.validators import validate_password
from app.core.rate_limit import limiter

router = APIRouter()


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    is_verified: bool = False


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(request: Request, user_data: UserRegister, session: Session = Depends(get_session)):
    # 验证密码强度
    is_valid, error_code = validate_password(user_data.password)
    if not is_valid:
        raise APIException(400, error_code)
    
    existing = session.exec(select(User).where(
        (User.email == user_data.email) | (User.username == user_data.username)
    )).first()
    if existing:
        if existing.email == user_data.email:
            raise APIException(400, "email_already_exists")
        raise APIException(400, "username_already_exists")

    user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hash_password(user_data.password)
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # 发送验证邮件
    from app.services.verification_service import create_verification_code
    from app.services.email_service import email_service
    from app.models.verification import VerificationType
    
    code = create_verification_code(session, user.id, VerificationType.EMAIL_VERIFY)
    session.commit()
    await email_service.send_verification_email(user.email, user.username, code)
    
    return user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise APIException(401, "invalid_credentials")

    tokens = create_tokens(session, user.id)
    session.commit()
    
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        is_verified=user.is_verified
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshRequest, session: Session = Depends(get_session)):
    """使用 Refresh Token 获取新的 Token"""
    user_id = verify_refresh_token(session, data.refresh_token)
    if not user_id:
        raise APIException(401, "invalid_refresh_token")
    
    # 撤销旧的 Refresh Token
    revoke_refresh_token(session, data.refresh_token)
    
    # 创建新的 Token
    user = session.get(User, user_id)
    if not user:
        raise APIException(401, "user_not_found")
    
    tokens = create_tokens(session, user_id)
    session.commit()
    
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        is_verified=user.is_verified
    )


@router.post("/logout")
def logout(data: RefreshRequest, session: Session = Depends(get_session)):
    """登出，撤销 Refresh Token"""
    revoke_refresh_token(session, data.refresh_token)
    session.commit()
    return {"success": True}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

class UserUpdate(BaseModel):
    username: str | None = None
    avatar: str | None = None

@router.put("/me", response_model=UserResponse)
def update_me(user_data: UserUpdate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if user_data.username:
        existing = session.exec(select(User).where(User.username == user_data.username, User.id != current_user.id)).first()
        if existing:
            raise APIException(400, "username_already_exists")
        current_user.username = user_data.username
    if user_data.avatar is not None:
        current_user.avatar = user_data.avatar
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

@router.get("/me/stats")
def get_my_stats(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    post_count = session.exec(select(func.count(Post.id)).where(Post.user_id == current_user.id)).one()
    like_count = session.exec(select(func.count(Interaction.id)).where(Interaction.user_id == current_user.id, Interaction.type == InteractionType.LIKE)).one()
    favorite_count = session.exec(select(func.count(Interaction.id)).where(Interaction.user_id == current_user.id, Interaction.type == InteractionType.FAVORITE)).one()
    comment_count = session.exec(select(func.count(Comment.id)).where(Comment.user_id == current_user.id)).one()
    return {"post_count": post_count, "like_count": like_count, "favorite_count": favorite_count, "comment_count": comment_count}


# ============ 邮箱验证相关接口 ============

class VerifyEmailRequest(BaseModel):
    code: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    code: str
    new_password: str


class ResendVerifyRequest(BaseModel):
    email: str


@router.post("/verify-email")
async def verify_email(data: VerifyEmailRequest, session: Session = Depends(get_session)):
    """验证邮箱"""
    from app.services.verification_service import verify_code, mark_user_verified
    from app.models.verification import VerificationType
    
    is_valid, user_id, error_code = verify_code(session, data.code, VerificationType.EMAIL_VERIFY)
    if not is_valid:
        raise APIException(400, error_code)
    
    mark_user_verified(session, user_id)
    session.commit()
    
    return {"success": True, "message": "邮箱验证成功"}


@router.post("/resend-verify")
async def resend_verification(data: ResendVerifyRequest, session: Session = Depends(get_session)):
    """重新发送验证邮件"""
    from app.services.verification_service import create_verification_code
    from app.services.email_service import email_service
    from app.models.verification import VerificationType
    
    user = session.exec(select(User).where(User.email == data.email)).first()
    if not user:
        # 为了安全，不透露用户是否存在
        return {"success": True, "message": "如果邮箱存在，验证邮件已发送"}
    
    if user.is_verified:
        raise APIException(400, "email_already_verified")
    
    code = create_verification_code(session, user.id, VerificationType.EMAIL_VERIFY)
    session.commit()
    
    await email_service.send_verification_email(user.email, user.username, code)
    
    return {"success": True, "message": "验证邮件已发送"}


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, data: ForgotPasswordRequest, session: Session = Depends(get_session)):
    """忘记密码，发送重置邮件"""
    from app.services.verification_service import create_verification_code
    from app.services.email_service import email_service
    from app.models.verification import VerificationType
    
    user = session.exec(select(User).where(User.email == data.email)).first()
    if not user:
        # 为了安全，不透露用户是否存在
        return {"success": True, "message": "如果邮箱存在，重置邮件已发送"}
    
    code = create_verification_code(session, user.id, VerificationType.PASSWORD_RESET)
    session.commit()
    
    await email_service.send_password_reset_email(user.email, user.username, code)
    
    return {"success": True, "message": "重置邮件已发送"}


@router.post("/reset-password")
@limiter.limit("3/minute")
def reset_password(request: Request, data: ResetPasswordRequest, session: Session = Depends(get_session)):
    """重置密码"""
    from app.services.verification_service import verify_code
    from app.models.verification import VerificationType
    
    # 验证新密码强度
    is_valid, error_code = validate_password(data.new_password)
    if not is_valid:
        raise APIException(400, error_code)
    
    # 验证重置码
    is_valid, user_id, error_code = verify_code(session, data.code, VerificationType.PASSWORD_RESET)
    if not is_valid:
        raise APIException(400, error_code)
    
    # 更新密码
    user = session.get(User, user_id)
    if not user:
        raise APIException(404, "user_not_found")
    
    user.password_hash = hash_password(data.new_password)
    session.add(user)
    
    # 撤销所有 Refresh Token
    revoke_user_tokens(session, user_id)
    
    session.commit()
    
    return {"success": True, "message": "密码重置成功"}


# ============ 头像上传接口 ============

from fastapi import UploadFile, File
from pathlib import Path
import os


ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_AVATAR_SIZE = 2 * 1024 * 1024  # 2MB


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """上传用户头像"""
    # 验证文件类型
    if file.content_type not in ALLOWED_AVATAR_TYPES:
        raise APIException(400, "invalid_avatar_type")
    
    # 读取文件内容
    content = await file.read()
    
    # 验证文件大小
    if len(content) > MAX_AVATAR_SIZE:
        raise APIException(400, "avatar_too_large")
    
    # 生成文件名
    import uuid
    ext = Path(file.filename).suffix if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = Path("uploads") / "avatars" / filename
    
    # 确保目录存在
    filepath.parent.mkdir(parents=True, exist_ok=True)
    
    # 删除旧头像
    if current_user.avatar:
        old_path = Path(current_user.avatar.lstrip("/"))
        if old_path.exists() and "avatars" in str(old_path):
            try:
                os.remove(old_path)
            except:
                pass
    
    # 保存新头像
    import aiofiles
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)
    
    # 记录到媒体库
    try:
        from app.models.media import Media
        media = Media(
            filename=filename,
            original_name=file.filename or "avatar",
            file_path=f"/uploads/avatars/{filename}",
            file_type=file.content_type or "image/jpeg",
            file_size=len(content),
            uploaded_by=None  # 头像不关联管理员
        )
        session.add(media)
    except Exception as e:
        print(f"[Media] 记录头像失败: {e}")
    
    # 更新用户头像 URL
    current_user.avatar = f"/uploads/avatars/{filename}"
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return current_user
