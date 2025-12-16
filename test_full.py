"""
Project Neon 全面测试脚本
包含：接口测试、文件上传测试、通知测试、搜索测试
"""
import requests
import json
import os
import tempfile
from datetime import datetime

BASE_URL = "http://localhost:8000"

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def success(self, msg):
        self.passed += 1
        print(f"  ✅ {msg}")
    
    def fail(self, msg):
        self.failed += 1
        self.errors.append(msg)
        print(f"  ❌ {msg}")

result = TestResult()

def check_server():
    """检查服务器是否运行"""
    try:
        r = requests.get(f"{BASE_URL}/", timeout=5)
        return r.status_code == 200
    except:
        return False

# ==================== 1. 基础连接测试 ====================
def test_basic():
    print("\n📋 1. 基础连接测试")
    
    # 根路径
    r = requests.get(f"{BASE_URL}/")
    if r.status_code == 200:
        result.success("根路径访问正常")
    else:
        result.fail(f"根路径访问失败: {r.status_code}")
    
    # API 文档
    r = requests.get(f"{BASE_URL}/docs")
    if r.status_code == 200:
        result.success("Swagger 文档正常")
    else:
        result.fail(f"Swagger 文档失败: {r.status_code}")
    
    # 系统配置
    r = requests.get(f"{BASE_URL}/system/config")
    if r.status_code == 200:
        data = r.json()
        if "site_name" in data and "logo" in data:
            result.success("系统配置 API 正常")
        else:
            result.fail("系统配置缺少必要字段")
    else:
        result.fail(f"系统配置 API 失败: {r.status_code}")

# ==================== 2. 认证测试 ====================
def test_auth():
    print("\n📋 2. 认证模块测试")
    
    timestamp = int(datetime.now().timestamp())
    test_email = f"test_{timestamp}@example.com"
    test_password = "Test123456"
    
    # 注册
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "email": test_email,
        "username": f"testuser_{timestamp}",
        "password": test_password
    })
    if r.status_code == 201:
        result.success("用户注册成功")
    else:
        result.fail(f"用户注册失败: {r.status_code} - {r.text}")
        return None, None
    
    # 登录
    r = requests.post(f"{BASE_URL}/auth/login", data={
        "username": test_email,
        "password": test_password
    })
    if r.status_code == 200:
        data = r.json()
        if "access_token" in data and "refresh_token" in data:
            result.success("用户登录成功，双Token正常")
            return data["access_token"], data["refresh_token"]
        else:
            result.fail("登录响应缺少Token")
    else:
        result.fail(f"用户登录失败: {r.status_code}")
    
    return None, None

# ==================== 3. 用户信息测试 ====================
def test_user_info(token):
    print("\n📋 3. 用户信息测试")
    if not token:
        result.fail("无Token，跳过")
        return None
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 获取当前用户
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if r.status_code == 200:
        data = r.json()
        result.success(f"获取用户信息成功: {data.get('username')}")
        return data.get("id")
    else:
        result.fail(f"获取用户信息失败: {r.status_code}")
        return None

# ==================== 4. 发帖测试（含文件上传限制） ====================
def test_posts(token):
    print("\n📋 4. 发帖测试")
    if not token:
        result.fail("无Token，跳过")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 纯文本发帖
    r = requests.post(f"{BASE_URL}/posts/", headers=headers, data={
        "content": f"测试动态 {datetime.now()}"
    })
    if r.status_code == 201:
        result.success("纯文本发帖成功")
    else:
        result.fail(f"纯文本发帖失败: {r.status_code}")
    
    # 测试非法文件上传（PDF）
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(b"%PDF-1.4 fake pdf content")
        pdf_path = f.name
    
    try:
        with open(pdf_path, "rb") as f:
            r = requests.post(f"{BASE_URL}/posts/", headers=headers, 
                data={"content": "测试PDF上传"},
                files={"files": ("test.pdf", f, "application/pdf")})
        if r.status_code == 400 and "invalid_file_type" in r.text:
            result.success("PDF上传被正确拒绝")
        else:
            result.fail(f"PDF上传应该被拒绝: {r.status_code}")
    finally:
        os.unlink(pdf_path)
    
    # 获取动态列表
    r = requests.get(f"{BASE_URL}/posts/")
    if r.status_code == 200:
        data = r.json()
        if "items" in data and "total" in data:
            result.success(f"获取动态列表成功，共{data['total']}条")
        else:
            result.fail("动态列表格式错误")
    else:
        result.fail(f"获取动态列表失败: {r.status_code}")

# ==================== 5. 通知测试 ====================
def test_notifications(token):
    print("\n📋 5. 通知测试")
    if not token:
        result.fail("无Token，跳过")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    r = requests.get(f"{BASE_URL}/notifications/", headers=headers)
    if r.status_code == 200:
        result.success("获取通知列表成功")
    else:
        result.fail(f"获取通知列表失败: {r.status_code}")

# ==================== 6. 搜索测试 ====================
def test_search():
    print("\n📋 6. 搜索测试")
    
    # 搜索动态
    r = requests.get(f"{BASE_URL}/search/posts", params={"q": "测试"})
    if r.status_code == 200:
        result.success("搜索动态成功")
    else:
        result.fail(f"搜索动态失败: {r.status_code}")
    
    # 搜索用户
    r = requests.get(f"{BASE_URL}/search/users", params={"q": "test"})
    if r.status_code == 200:
        result.success("搜索用户成功")
    else:
        result.fail(f"搜索用户失败: {r.status_code}")

# ==================== 7. 管理后台测试 ====================
def test_admin():
    print("\n📋 7. 管理后台测试")
    
    # 登录页面
    r = requests.get(f"{BASE_URL}/admin/login")
    if r.status_code == 200:
        result.success("管理后台登录页正常")
    else:
        result.fail(f"管理后台登录页失败: {r.status_code}")
    
    # 管理员登录
    session = requests.Session()
    r = session.post(f"{BASE_URL}/admin/login", data={
        "username": "admin",
        "password": "Admin123"
    }, allow_redirects=False)
    
    if r.status_code in [302, 303]:
        result.success("管理员登录成功")
        
        # 测试仪表盘
        r = session.get(f"{BASE_URL}/admin/dashboard")
        if r.status_code == 200:
            result.success("仪表盘页面正常")
        else:
            result.fail(f"仪表盘页面失败: {r.status_code}")
    else:
        result.fail(f"管理员登录失败: {r.status_code}")

# ==================== 主函数 ====================
def main():
    print("=" * 60)
    print("🚀 Project Neon 全面测试")
    print("=" * 60)
    
    if not check_server():
        print("\n❌ 无法连接到服务器！")
        print("请先启动后端服务")
        return
    
    # 运行所有测试
    test_basic()
    access_token, refresh_token = test_auth()
    user_id = test_user_info(access_token)
    test_posts(access_token)
    test_notifications(access_token)
    test_search()
    test_admin()
    
    # 汇总
    print("\n" + "=" * 60)
    print(f"📊 测试结果: 通过 {result.passed}, 失败 {result.failed}")
    print("=" * 60)
    
    if result.errors:
        print("\n❌ 失败项:")
        for err in result.errors:
            print(f"  - {err}")
    else:
        print("\n✅ 所有测试通过!")

if __name__ == "__main__":
    main()
