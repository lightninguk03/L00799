"""
管理员认证后端
"""
from datetime import datetime
from typing import Optional
from starlette.requests import Request
from starlette.responses import Response
from sqladmin.authentication import AuthenticationBackend
from sqlmodel import Session, select
from app.database import engine
from app.models.admin_user import AdminUser
from app.core.security import verify_password


class AdminAuth(AuthenticationBackend):
    """SQLAdmin 认证后端"""
    
    async def login(self, request: Request) -> bool:
        """处理登录请求"""
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
        
        if not username or not password:
            return False
        
        with Session(engine) as session:
            admin = session.exec(
                select(AdminUser).where(AdminUser.username == username)
            ).first()
            
            if not admin:
                return False
            
            if not admin.is_active:
                return False
            
            if not verify_password(password, admin.password_hash):
                return False
            
            # 更新最后登录时间
            admin.last_login = datetime.utcnow()
            session.add(admin)
            session.commit()
            
            # 设置 session
            request.session.update({
                "admin_id": admin.id,
                "admin_username": admin.username,
                "admin_role": admin.role.value
            })
            
            return True
    
    async def logout(self, request: Request) -> bool:
        """处理登出请求"""
        request.session.clear()
        return True
    
    async def authenticate(self, request: Request) -> bool:
        """验证请求是否已认证
        
        返回 True 表示已认证，False 表示未认证
        """
        try:
            admin_id = request.session.get("admin_id")
            
            if not admin_id:
                return False
            
            # 验证管理员是否仍然有效
            with Session(engine) as session:
                admin = session.get(AdminUser, admin_id)
                if not admin or not admin.is_active:
                    request.session.clear()
                    return False
            
            return True
        except Exception as e:
            print(f"Authentication error: {e}")
            return False
