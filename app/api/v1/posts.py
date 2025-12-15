from fastapi import APIRouter, Depends, UploadFile, File, Form, Request
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime
import json
from app.database import get_session
from app.dependencies import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.post import Post, MediaType
from app.models.interaction import Interaction, InteractionType
from app.models.comment import Comment
from app.schemas.post import PostResponse, InteractRequest, CommentCreate, CommentResponse, UserInfo
from app.schemas.common import PaginatedResponse
from app.utils.file_handler import save_file, validate_image, validate_video
from app.core.exceptions import APIException
from app.models.notification import NotificationType
from app.api.v1.notifications import create_notification
from app.core.rate_limit import limiter

router = APIRouter()

def build_post_response(post: Post, session: Session, current_user_id: Optional[int] = None) -> dict:
    """构建完整的 PostResponse，包含统计数据和用户信息"""
    # 获取点赞数
    like_count = session.exec(
        select(func.count(Interaction.id)).where(
            Interaction.post_id == post.id,
            Interaction.type == InteractionType.LIKE
        )
    ).one()

    # 获取评论数
    comment_count = session.exec(
        select(func.count(Comment.id)).where(Comment.post_id == post.id)
    ).one()

    # 获取用户信息
    user = session.get(User, post.user_id)
    user_info = UserInfo(id=user.id, username=user.username, avatar=user.avatar) if user else None

    # 检查当前用户是否点赞/收藏
    is_liked = False
    is_collected = False
    if current_user_id:
        is_liked = session.exec(
            select(Interaction).where(
                Interaction.user_id == current_user_id,
                Interaction.post_id == post.id,
                Interaction.type == InteractionType.LIKE
            )
        ).first() is not None

        is_collected = session.exec(
            select(Interaction).where(
                Interaction.user_id == current_user_id,
                Interaction.post_id == post.id,
                Interaction.type == InteractionType.FAVORITE
            )
        ).first() is not None

    # 解析 media_urls JSON 字符串为数组
    media_urls_list = []
    if post.media_urls:
        try:
            media_urls_list = json.loads(post.media_urls)
        except json.JSONDecodeError:
            media_urls_list = []

    return {
        "id": post.id,
        "user_id": post.user_id,
        "content": post.content,
        "media_type": post.media_type,
        "media_urls": media_urls_list,  # 返回数组而非 JSON 字符串
        "category_id": post.category_id,
        "repost_source_id": post.repost_source_id,
        "created_at": post.created_at,
        "like_count": like_count,
        "comment_count": comment_count,
        "view_count": post.view_count,
        "is_liked": is_liked,
        "is_collected": is_collected,
        "user": user_info
    }

@router.post("/", response_model=PostResponse, status_code=201)
@limiter.limit("20/minute")
async def create_post(
    request: Request,
    content: str = Form(...),
    category_id: int | None = Form(None),
    files: List[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    media_urls = []
    media_type = MediaType.TEXT

    if files:
        for file in files:
            if file.content_type.startswith("image/"):
                await validate_image(file)
                url = await save_file(file, "images", user_id=current_user.id)
                media_urls.append(url)
                media_type = MediaType.IMAGE
            elif file.content_type.startswith("video/"):
                await validate_video(file)
                url = await save_file(file, "videos", user_id=current_user.id)
                media_urls.append(url)
                media_type = MediaType.VIDEO

    post = Post(
        user_id=current_user.id,
        content=content,
        media_type=media_type,
        media_urls=json.dumps(media_urls) if media_urls else None,
        category_id=category_id
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    return build_post_response(post, session, current_user.id)

@router.get("/me", response_model=PaginatedResponse[PostResponse])
def get_my_posts(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    page_size = min(page_size, 100)

    query = select(Post).where(Post.user_id == current_user.id).order_by(Post.created_at.desc())

    total = session.exec(select(func.count(Post.id)).where(Post.user_id == current_user.id)).one()

    offset = (page - 1) * page_size
    posts = session.exec(query.offset(offset).limit(page_size)).all()

    items = [build_post_response(post, session, current_user.id) for post in posts]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }

@router.get("/", response_model=PaginatedResponse[PostResponse])
async def get_posts(
    page: int = 1,
    page_size: int = 20,
    category_id: int | None = None,
    user_id: int | None = None,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_current_user_optional)
):
    # 限制 page_size 最大值
    page_size = min(page_size, 100)

    query = select(Post).order_by(Post.created_at.desc())
    if category_id:
        query = query.where(Post.category_id == category_id)
    if user_id:
        query = query.where(Post.user_id == user_id)

    # 计算总数
    total = session.exec(select(func.count(Post.id)).where(*query.whereclause.clauses if query.whereclause is not None else [])).one()

    # 获取分页数据
    offset = (page - 1) * page_size
    posts = session.exec(query.offset(offset).limit(page_size)).all()

    # 构建完整响应
    current_user_id = current_user.id if current_user else None
    items = [build_post_response(post, session, current_user_id) for post in posts]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_current_user_optional)
):
    post = session.get(Post, post_id)
    if not post:
        raise APIException(404, "post_not_found")

    # 增加浏览数
    post.view_count += 1
    session.add(post)
    session.commit()
    session.refresh(post)

    current_user_id = current_user.id if current_user else None
    return build_post_response(post, session, current_user_id)

@router.post("/{post_id}/interact")
def interact_post(
    post_id: int,
    data: InteractRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    post = session.get(Post, post_id)
    if not post:
        raise APIException(404, "post_not_found")

    interaction_type = InteractionType.LIKE if data.interaction_type == "like" else InteractionType.FAVORITE
    existing = session.exec(select(Interaction).where(
        Interaction.user_id == current_user.id,
        Interaction.post_id == post_id,
        Interaction.type == interaction_type
    )).first()

    if existing:
        session.delete(existing)
        session.commit()
        return {"action": "removed"}
    else:
        interaction = Interaction(user_id=current_user.id, post_id=post_id, type=interaction_type)
        session.add(interaction)

        # 创建通知
        if interaction_type == InteractionType.LIKE:
            create_notification(session, post.user_id, current_user.id, NotificationType.LIKE, post_id)

        session.commit()
        return {"action": "added"}

@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=201)
def create_comment(
    post_id: int,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    post = session.get(Post, post_id)
    if not post:
        raise APIException(404, "post_not_found")

    comment = Comment(user_id=current_user.id, post_id=post_id, content=data.content)
    session.add(comment)

    # 创建通知
    create_notification(session, post.user_id, current_user.id, NotificationType.COMMENT, post_id)

    session.commit()
    session.refresh(comment)
    return comment

@router.get("/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(post_id: int, session: Session = Depends(get_session)):
    comments = session.exec(select(Comment).where(Comment.post_id == post_id).order_by(Comment.created_at.desc())).all()
    return comments

@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    post = session.get(Post, post_id)
    if not post:
        raise APIException(404, "post_not_found")
    if post.user_id != current_user.id:
        raise APIException(403, "unauthorized")

    session.delete(post)
    session.commit()
    return {"success": True}

@router.put("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    content: str = Form(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    post = session.get(Post, post_id)
    if not post:
        raise APIException(404, "post_not_found")
    if post.user_id != current_user.id:
        raise APIException(403, "unauthorized")

    post.content = content
    post.updated_at = datetime.utcnow()
    session.add(post)
    session.commit()
    session.refresh(post)
    return build_post_response(post, session, current_user.id)

@router.post("/{post_id}/repost", response_model=PostResponse, status_code=201)
def repost(
    post_id: int,
    content: str = Form(""),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    original = session.get(Post, post_id)
    if not original:
        raise APIException(404, "post_not_found")

    post = Post(
        user_id=current_user.id,
        content=content,
        media_type=MediaType.TEXT,
        repost_source_id=post_id
    )
    session.add(post)

    # 创建通知
    create_notification(session, original.user_id, current_user.id, NotificationType.REPOST, post_id)

    session.commit()
    session.refresh(post)
    return build_post_response(post, session, current_user.id)
