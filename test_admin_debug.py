"""
调试管理后台
"""
import requests

BASE_URL = "http://localhost:8000"

session = requests.Session()

# 登录
login_data = {"username": "admin", "password": "Admin123"}
response = session.post(f"{BASE_URL}/admin/login", data=login_data, allow_redirects=False)
print(f"登录状态: {response.status_code}")
print(f"登录 cookies: {session.cookies.get_dict()}")

# 访问仪表盘
response = session.get(f"{BASE_URL}/admin/dashboard", allow_redirects=False)
print(f"\n仪表盘状态: {response.status_code}")
if response.status_code == 302:
    print(f"重定向到: {response.headers.get('location')}")
else:
    print(f"内容长度: {len(response.text)}")
    print(f"内容前500字符:\n{response.text[:500]}")
