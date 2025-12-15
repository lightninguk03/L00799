from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from typing import List
from app.database import get_session
from app.models.category import Category
from app.models.post import Post, MediaType
from app.schemas.post import PostResponse
from app.core.exceptions import APIException

router = APIRouter()


@router.get("/categories")
def get_categories(session: Session = Depends(get_session)):
    """获取所有分类"""
    categories = session.exec(select(Category)).all()
    return categories


@router.get("/{category_id}")
def get_gallery_by_category(
    category_id: int,
    page: int = 1,
    page_size: int = 30,
    session: Session = Depends(get_session)
):
    """获取分类下的图片动态"""
    category = session.get(Category, category_id)
    if not category:
        raise APIException(404, "category_not_found")

    page_size = min(page_size, 100)

    # 先查询总数
    total = session.exec(
        select(func.count(Post.id)).where(
            Post.category_id == category_id,
            Post.media_type == MediaType.IMAGE
        )
    ).one()

    # 再分页查询
    offset = (page - 1) * page_size
    posts = session.exec(
        select(Post).where(
            Post.category_id == category_id,
            Post.media_type == MediaType.IMAGE
        ).order_by(Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()

    return {
        "category": category,
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": posts
    }
