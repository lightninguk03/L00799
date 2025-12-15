"""
初始化管理员账户脚本

运行: python init_admin.py
"""
import sys
from sqlmodel import Session, select
from app.database import engine, create_db_and_tables
from app.models.admin_user import AdminUser, AdminRole
from app.core.security import hash_password


def create_admin(username: str, password: str, role: AdminRole = AdminRole.SUPER_ADMIN):
    """创建管理员账户"""
    with Session(engine) as session:
        # 检查是否已存在
        existing = session.exec(
            select(AdminUser).where(AdminUser.username == username)
        ).first()
        
        if existing:
            print(f"❌ 管理员 '{username}' 已存在")
            return False
        
        admin = AdminUser(
            username=username,
            password_hash=hash_password(password),
            role=role,
            is_active=True
        )
        session.add(admin)
        session.commit()
        
        print(f"✅ 管理员 '{username}' 创建成功")
        print(f"   角色: {role.value}")
        return True


def main():
    # 确保数据库表存在
    create_db_and_tables()
    
    print("=" * 50)
    print("🔧 Project Neon 管理员初始化")
    print("=" * 50)
    
    # 检查是否有命令行参数
    if len(sys.argv) >= 3:
        username = sys.argv[1]
        password = sys.argv[2]
        role = AdminRole.SUPER_ADMIN
        if len(sys.argv) >= 4 and sys.argv[3] == "operator":
            role = AdminRole.OPERATOR
    else:
        # 交互式输入
        print("\n请输入管理员信息:")
        username = input("用户名: ").strip()
        password = input("密码: ").strip()
        
        if not username or not password:
            print("❌ 用户名和密码不能为空")
            return
        
        role_input = input("角色 (1=超级管理员, 2=运营人员) [1]: ").strip()
        role = AdminRole.OPERATOR if role_input == "2" else AdminRole.SUPER_ADMIN
    
    create_admin(username, password, role)
    
    print("\n" + "=" * 50)
    print("💡 提示: 访问 http://localhost:8000/admin 登录管理后台")
    print("=" * 50)


if __name__ == "__main__":
    main()
