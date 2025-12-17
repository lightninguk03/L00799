from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from typing import Optional
from app.database import get_session
from app.dependencies import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.post import Post
from app.models.follow import Follow
from app.models.notification import Notification, NotificationType
from app.schemas.follow import UserBrief, UserProfileResponse
from app.schemas.post import PostResponse
from app.schemas.common import PaginatedResponse
from app.core.exceptions import APIException
from app.api.v1.posts import build_post_response

router = APIRouter()


@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """获取用户个人主页"""
    user = session.get(User, user_id)
    if not user:
        raise APIException(404, "user_not_found")
    
    # 统计数据
    post_count = session.exec(
        select(func.count(Post.id)).where(Post.user_id == user_id)
    ).one()
    
    following_count = session.exec(
        select(func.count(Follow.id)).where(Follow.follower_id == user_id)
    ).one()
    
    follower_count = session.exec(
        select(func.count(Follow.id)).where(Follow.following_id == user_id)
    ).one()
    
    # 检查当前用户是否关注
    is_following = False
    if current_user:
        follow = session.exec(
            select(Follow).where(
                Follow.follower_id == current_user.id,
                Follow.following_id == user_id
            )
        ).first()
        is_following = follow is not None
    
    return UserProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        avatar=user.avatar,
        is_verified=user.is_verified,
        created_at=user.created_at,
        post_count=post_count,
        following_count=following_count,
        follower_count=follower_count,
        is_following=is_following
    )


@router.get("/{user_id}/posts", response_model=PaginatedResponse[PostResponse])
def get_user_posts(
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    session: Session = Depends(get_session)
):
    """获取用户的动态列表"""
    user = session.get(User, user_id)
    if not user:
        raise APIException(404, "user_not_found")
    
    page_size = min(page_size, 100)
    
    total = session.exec(
        select(func.count(Post.id)).where(Post.user_id == user_id)
    ).one()
    
    offset = (page - 1) * page_size
    posts = session.exec(
        select(Post)
        .where(Post.user_id == user_id)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()
    
    items = [build_post_response(post, session) for post in posts]
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }


@router.post("/{user_id}/follow")
def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """关注用户"""
    # 不能关注自己
    if user_id == current_user.id:
        raise APIException(400, "cannot_follow_self")
    
    # 检查目标用户是否存在
    target_user = session.get(User, user_id)
    if not target_user:
        raise APIException(404, "user_not_found")
    
    # 检查是否已关注
    existing = session.exec(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id
        )
    ).first()
    
    if existing:
        raise APIException(400, "already_following")
    
    # 创建关注关系
    follow = Follow(follower_id=current_user.id, following_id=user_id)
    session.add(follow)
    
    # 创建通知
    notification = Notification(
        user_id=user_id,
        actor_id=current_user.id,
        type=NotificationType.FOLLOW
    )
    session.add(notification)
    
    session.commit()
    
    return {"success": True, "action": "followed"}


@router.delete("/{user_id}/follow")
def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """取消关注用户"""
    follow = session.exec(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id
        )
    ).first()
    
    if not follow:
        raise APIException(400, "not_following")
    
    session.delete(follow)
    session.commit()
    
    return {"success": True, "action": "unfollowed"}


@router.get("/{user_id}/following", response_model=PaginatedResponse[UserBrief])
def get_following(
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    session: Session = Depends(get_session)
):
    """获取用户的关注列表"""
    user = session.get(User, user_id)
    if not user:
        raise APIException(404, "user_not_found")
    
    page_size = min(page_size, 100)
    
    total = session.exec(
        select(func.count(Follow.id)).where(Follow.follower_id == user_id)
    ).one()
    
    offset = (page - 1) * page_size
    follows = session.exec(
        select(Follow)
        .where(Follow.follower_id == user_id)
        .order_by(Follow.created_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()
    
    items = []
    for follow in follows:
        following_user = session.get(User, follow.following_id)
        if following_user:
            items.append(UserBrief(
                id=following_user.id,
                username=following_user.username,
                avatar=following_user.avatar
            ))
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }


@router.get("/{user_id}/followers", response_model=PaginatedResponse[UserBrief])
def get_followers(
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    session: Session = Depends(get_session)
):
    """获取用户的粉丝列表"""
    user = session.get(User, user_id)
    if not user:
        raise APIException(404, "user_not_found")
    
    page_size = min(page_size, 100)
    
    total = session.exec(
        select(func.count(Follow.id)).where(Follow.following_id == user_id)
    ).one()
    
    offset = (page - 1) * page_size
    follows = session.exec(
        select(Follow)
        .where(Follow.following_id == user_id)
        .order_by(Follow.created_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()
    
    items = []
    for follow in follows:
        follower_user = session.get(User, follow.follower_id)
        if follower_user:
            items.append(UserBrief(
                id=follower_user.id,
                username=follower_user.username,
                avatar=follower_user.avatar
            ))
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }
