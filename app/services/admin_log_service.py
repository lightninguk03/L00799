"""
管理员操作日志服务
"""
import json
from datetime import datetime
from sqlmodel import Session
from starlette.requests import Request
from app.models.admin_log import AdminLog


def log_admin_action(
    session: Session,
    request: Request,
    action: str,
    target_type: str,
    target_id: int = None,
    target_name: str = None,
    details: dict = None
):
    """
    记录管理员操作日志
    
    Args:
        session: 数据库会话
        request: HTTP 请求对象
        action: 操作类型 (create/update/delete/ban/unban/login/logout/export)
        target_type: 目标类型 (user/post/comment/config/admin)
        target_id: 目标 ID
        target_name: 目标名称
        details: 详细信息字典
    """
    admin_id = request.session.get("admin_id")
    admin_username = request.session.get("admin_username", "未知")
    
    # 获取客户端 IP
    ip_address = request.client.host if request.client else None
    # 检查是否有代理头
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip_address = forwarded.split(",")[0].strip()
    
    log = AdminLog(
        admin_id=admin_id or 0,
        admin_username=admin_username,
        action=action,
        target_type=target_type,
        target_id=target_id,
        target_name=target_name,
        details=json.dumps(details, ensure_ascii=False) if details else None,
        ip_address=ip_address,
        created_at=datetime.utcnow()
    )
    
    session.add(log)
    # 注意：不在这里 commit，让调用方决定何时提交
