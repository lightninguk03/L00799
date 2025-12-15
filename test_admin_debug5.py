"""
调试仪表盘页面
"""
import requests

BASE_URL = "http://localhost:8000"

session = requests.Session()

# 登录
login_data = {"username": "admin", "password": "Admin123"}
response = session.post(f"{BASE_URL}/admin/login", data=login_data, allow_redirects=False)
print(f"登录状态: {response.status_code}")

# 访问仪表盘
response = session.get(f"{BASE_URL}/admin/dashboard")
print(f"仪表盘状态: {response.status_code}")
print(f"内容长度: {len(response.text)}")

# 检查内容
content = response.text
print(f"\n包含 '仪表盘': {'仪表盘' in content}")
print(f"包含 'dashboard': {'dashboard' in content.lower()}")
print(f"包含 'error': {'error' in content.lower()}")

# 打印部分内容
print(f"\n内容前1000字符:\n{content[:1000]}")
