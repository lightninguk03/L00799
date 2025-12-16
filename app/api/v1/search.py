from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func, or_
from app.database import get_session
from app.models.post import Post
from app.models.user import User
from app.schemas.post import PostResponse
from app.schemas.user import UserResponse
from app.schemas.common import PaginatedResponse
from app.api.v1.posts import build_post_response

router = APIRouter()

@router.get("/posts", response_model=PaginatedResponse[PostResponse])
def search_posts(
    q: str,
    page: int = 1,
    page_size: int = 20,
    session: Session = Depends(get_session)
):
    """搜索动态"""
    if not q or not q.strip():
        return {"total": 0, "page": page, "page_size": page_size, "items": []}
    
    page_size = min(page_size, 100)
    search_term = f"%{q.strip()}%"

    # 使用 like 进行模糊搜索
    query = select(Post).where(Post.content.like(search_term)).order_by(Post.created_at.desc())
    total = session.exec(select(func.count(Post.id)).where(Post.content.like(search_term))).one()

    offset = (page - 1) * page_size
    posts = session.exec(query.offset(offset).limit(page_size)).all()

    items = [build_post_response(post, session) for post in posts]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }

@router.get("/users", response_model=PaginatedResponse[UserResponse])
def search_users(
    q: str,
    page: int = 1,
    page_size: int = 20,
    session: Session = Depends(get_session)
):
    """搜索用户"""
    if not q or not q.strip():
        return {"total": 0, "page": page, "page_size": page_size, "items": []}
    
    page_size = min(page_size, 100)
    search_term = f"%{q.strip()}%"

    # 使用 like 进行模糊搜索
    query = select(User).where(
        or_(User.username.like(search_term), User.email.like(search_term))
    ).order_by(User.created_at.desc())

    total = session.exec(
        select(func.count(User.id)).where(
            or_(User.username.like(search_term), User.email.like(search_term))
        )
    ).one()

    offset = (page - 1) * page_size
    users = session.exec(query.offset(offset).limit(page_size)).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": users
    }
