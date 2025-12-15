"""
调试管理后台 - 测试不同页面
"""
import requests

BASE_URL = "http://localhost:8000"

session = requests.Session()

# 登录
login_data = {"username": "admin", "password": "Admin123"}
response = session.post(f"{BASE_URL}/admin/login", data=login_data, allow_redirects=False)
print(f"登录状态: {response.status_code}")

# 测试不同页面
pages = [
    "/admin/",
    "/admin/user/list",
    "/admin/post/list",
    "/admin/dashboard",
    "/admin/reports"
]

for page in pages:
    response = session.get(f"{BASE_URL}{page}", allow_redirects=False)
    status = "✅" if response.status_code == 200 else "❌"
    print(f"{status} {page}: {response.status_code}")
