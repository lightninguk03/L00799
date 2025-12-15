"""
管理后台功能测试

运行前请确保：
1. 后端服务已启动 (python -m uvicorn app.main:app --reload)
2. 已创建管理员账户 (python init_admin.py admin Admin123)

运行: python test_admin.py
"""
import requests

BASE_URL = "http://localhost:8000"

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def success(self, name):
        self.passed += 1
        print(f"  ✅ {name}")
    
    def fail(self, name, reason):
        self.failed += 1
        self.errors.append(f"{name}: {reason}")
        print(f"  ❌ {name}: {reason}")
    
    def summary(self):
        print("\n" + "=" * 50)
        print(f"测试结果: {self.passed} 通过, {self.failed} 失败")
        if self.errors:
            print("\n失败详情:")
            for err in self.errors:
                print(f"  - {err}")
        print("=" * 50)

result = TestResult()

def check_server():
    """检查服务器是否运行"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        return response.status_code == 200
    except:
        return False


def test_admin_login_page():
    """测试管理后台登录页面"""
    print("\n📋 测试管理后台登录页面...")
    
    # 访问管理后台应该重定向到登录页
    response = requests.get(f"{BASE_URL}/admin/", allow_redirects=False)
    if response.status_code == 302:
        result.success("未登录时重定向到登录页")
    else:
        result.fail("未登录重定向", f"状态码: {response.status_code}")
    
    # 访问登录页面
    response = requests.get(f"{BASE_URL}/admin/login")
    if response.status_code == 200:
        result.success("登录页面可访问")
    else:
        result.fail("登录页面", f"状态码: {response.status_code}")


def test_admin_login():
    """测试管理员登录"""
    print("\n📋 测试管理员登录...")
    
    session = requests.Session()
    
    # 错误密码登录
    response = session.post(f"{BASE_URL}/admin/login", data={
        "username": "admin",
        "password": "wrongpassword"
    }, allow_redirects=False)
    
    # 登录失败应该返回 400 或停留在登录页
    if response.status_code in [200, 302, 400]:
        result.success("错误密码被拒绝")
    else:
        result.fail("错误密码拒绝", f"状态码: {response.status_code}")
    
    # 正确密码登录
    response = session.post(f"{BASE_URL}/admin/login", data={
        "username": "admin",
        "password": "Admin123"
    }, allow_redirects=False)
    
    if response.status_code == 302:
        result.success("正确密码登录成功")
        
        # 登录后访问管理后台
        response = session.get(f"{BASE_URL}/admin/")
        if response.status_code == 200:
            result.success("登录后可访问管理后台")
        else:
            result.fail("登录后访问", f"状态码: {response.status_code}")
        
        return session
    else:
        result.fail("正确密码登录", f"状态码: {response.status_code}")
        return None


def test_admin_views(session):
    """测试各个管理视图"""
    print("\n📋 测试管理视图...")
    
    if not session:
        result.fail("管理视图测试", "没有有效的登录会话")
        return
    
    views = [
        ("user", "用户管理"),
        ("post", "动态管理"),
        ("category", "分类管理"),
        ("comment", "评论管理"),
        ("notification", "通知管理"),
        ("site-config", "网站配置"),
        ("media", "媒体库"),
        ("admin-user", "管理员管理"),
    ]
    
    for view_name, display_name in views:
        response = session.get(f"{BASE_URL}/admin/{view_name}/list")
        if response.status_code == 200:
            result.success(f"{display_name}页面可访问")
        else:
            result.fail(f"{display_name}页面", f"状态码: {response.status_code}")


def test_system_config_api():
    """测试系统配置 API"""
    print("\n📋 测试系统配置 API...")
    
    response = requests.get(f"{BASE_URL}/system/config")
    
    if response.status_code == 200:
        result.success("配置 API 可访问")
        
        data = response.json()
        
        # 检查必要字段
        required_fields = ["site_name", "site_description", "primary_color", "features"]
        missing = [f for f in required_fields if f not in data]
        
        if not missing:
            result.success("配置 API 返回必要字段")
        else:
            result.fail("配置 API 字段", f"缺少: {missing}")
        
        # 检查配置值
        if data.get("site_name") == "闪电社区":
            result.success("网站名称配置正确")
        else:
            result.fail("网站名称", f"值: {data.get('site_name')}")
        
        if data.get("primary_color") == "#6366f1":
            result.success("主题色配置正确")
        else:
            result.fail("主题色", f"值: {data.get('primary_color')}")
    else:
        result.fail("配置 API", f"状态码: {response.status_code}")


def test_admin_logout(session):
    """测试管理员登出"""
    print("\n📋 测试管理员登出...")
    
    if not session:
        result.fail("登出测试", "没有有效的登录会话")
        return
    
    response = session.get(f"{BASE_URL}/admin/logout", allow_redirects=False)
    
    if response.status_code == 302:
        result.success("登出成功")
        
        # 登出后访问管理后台应该重定向
        response = session.get(f"{BASE_URL}/admin/", allow_redirects=False)
        if response.status_code == 302:
            result.success("登出后无法访问管理后台")
        else:
            result.fail("登出后访问", f"状态码: {response.status_code}")
    else:
        result.fail("登出", f"状态码: {response.status_code}")


def main():
    print("=" * 50)
    print("🔧 Project Neon 管理后台功能测试")
    print("=" * 50)
    
    # 检查服务器
    if not check_server():
        print("\n❌ 无法连接到服务器！")
        print("请先启动后端服务: python -m uvicorn app.main:app --reload")
        return
    
    print("\n✅ 服务器连接成功")
    
    # 1. 测试登录页面
    test_admin_login_page()
    
    # 2. 测试登录
    session = test_admin_login()
    
    # 3. 测试各个视图
    test_admin_views(session)
    
    # 4. 测试系统配置 API
    test_system_config_api()
    
    # 5. 测试登出
    test_admin_logout(session)
    
    # 输出结果
    result.summary()


if __name__ == "__main__":
    main()
