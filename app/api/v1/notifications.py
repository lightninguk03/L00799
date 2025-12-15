from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from typing import List
from app.database import get_session
from app.dependencies import get_current_user
from app.models.user import User
from app.models.notification import Notification, NotificationType
from app.schemas.notification import NotificationResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()

@router.get("/", response_model=PaginatedResponse[NotificationResponse])
def get_notifications(
    page: int = 1,
    page_size: int = 20,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    page_size = min(page_size, 100)

    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc())

    total = session.exec(select(func.count(Notification.id)).where(Notification.user_id == current_user.id)).one()

    offset = (page - 1) * page_size
    notifications = session.exec(query.offset(offset).limit(page_size)).all()

    items = []
    for notif in notifications:
        actor = session.get(User, notif.actor_id)
        items.append({
            "id": notif.id,
            "user_id": notif.user_id,
            "actor_id": notif.actor_id,
            "actor_username": actor.username if actor else "Unknown",
            "actor_avatar": actor.avatar if actor else None,
            "type": notif.type,
            "post_id": notif.post_id,
            "is_read": notif.is_read,
            "created_at": notif.created_at
        })

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }

@router.post("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    notif = session.get(Notification, notification_id)
    if notif and notif.user_id == current_user.id:
        notif.is_read = True
        session.add(notif)
        session.commit()
    return {"success": True}

@router.post("/read-all")
def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    notifications = session.exec(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    ).all()

    for notif in notifications:
        notif.is_read = True
        session.add(notif)

    session.commit()
    return {"success": True, "count": len(notifications)}

def create_notification(
    session: Session,
    user_id: int,
    actor_id: int,
    type: NotificationType,
    post_id: int | None = None
):
    """辅助函数：创建通知"""
    if user_id == actor_id:
        return

    notif = Notification(
        user_id=user_id,
        actor_id=actor_id,
        type=type,
        post_id=post_id
    )
    session.add(notif)
