"""测试 CSV 导出功能"""
import requests

BASE_URL = "http://localhost:8000"
session = requests.Session()

# 登录
session.post(f"{BASE_URL}/admin/login", data={"username": "admin", "password": "Admin123"})

# 测试导出 (使用新路径)
r = session.get(f"{BASE_URL}/admin-api/reports?export=users")
print(f"Status: {r.status_code}")
print(f"Content-Type: {r.headers.get('content-type')}")
print(f"Content-Disposition: {r.headers.get('content-disposition')}")
print(f"\nContent preview (first 500 chars):")
print(r.text[:500])
