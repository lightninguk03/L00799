"""
调试管理后台 - 详细检查
"""
import requests

BASE_URL = "http://localhost:8000"

session = requests.Session()

# 先获取登录页面（获取初始 cookie）
response = session.get(f"{BASE_URL}/admin/login")
print(f"获取登录页: {response.status_code}")
print(f"初始 cookies: {session.cookies.get_dict()}")

# 登录
login_data = {"username": "admin", "password": "Admin123"}
response = session.post(f"{BASE_URL}/admin/login", data=login_data, allow_redirects=False)
print(f"\n登录状态: {response.status_code}")
print(f"登录后 cookies: {session.cookies.get_dict()}")
print(f"响应头: {dict(response.headers)}")

# 跟随重定向
if response.status_code == 302:
    redirect_url = response.headers.get("location")
    print(f"\n重定向到: {redirect_url}")
    response = session.get(redirect_url if redirect_url.startswith("http") else f"{BASE_URL}{redirect_url}", allow_redirects=False)
    print(f"重定向后状态: {response.status_code}")
    print(f"重定向后 cookies: {session.cookies.get_dict()}")

# 测试访问
print("\n--- 测试访问 ---")
response = session.get(f"{BASE_URL}/admin/user/list", allow_redirects=False)
print(f"用户列表: {response.status_code}")
