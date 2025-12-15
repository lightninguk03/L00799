"""
调试管理后台 - 手动处理 cookie
"""
import requests

BASE_URL = "http://localhost:8000"

# 使用 Session
session = requests.Session()

# 登录
login_data = {"username": "admin", "password": "Admin123"}
response = session.post(f"{BASE_URL}/admin/login", data=login_data, allow_redirects=True)
print(f"登录最终状态: {response.status_code}")
print(f"最终 URL: {response.url}")
print(f"Cookies: {session.cookies.get_dict()}")

# 如果 cookies 为空，手动设置
if not session.cookies.get_dict():
    print("\n尝试手动登录...")
    # 重新登录，不跟随重定向
    response = session.post(f"{BASE_URL}/admin/login", data=login_data, allow_redirects=False)
    print(f"登录状态: {response.status_code}")
    
    # 从响应头获取 cookie
    set_cookie = response.headers.get("set-cookie", "")
    print(f"Set-Cookie: {set_cookie[:100]}...")
    
    # 手动访问
    cookies = session.cookies.get_dict()
    print(f"Session cookies: {cookies}")

# 测试访问
print("\n--- 测试访问 ---")
response = session.get(f"{BASE_URL}/admin/user/list")
print(f"用户列表: {response.status_code}")
print(f"页面标题: {'用户' in response.text}")
