"""调试 Cookie 问题"""
import requests

s = requests.Session()

# 登录
print("POST /admin/login")
r = s.post("http://localhost:8000/admin/login", 
    data={"username": "admin", "password": "Admin123"},
    allow_redirects=False)
print(f"Status: {r.status_code}")
print(f"Set-Cookie headers:")
for h in r.headers.items():
    if h[0].lower() == 'set-cookie':
        print(f"  {h[1]}")

print(f"\nSession cookies in jar:")
for cookie in s.cookies:
    print(f"  Name: {cookie.name}")
    print(f"  Value: {cookie.value[:50]}...")
    print(f"  Domain: {cookie.domain}")
    print(f"  Path: {cookie.path}")
    print()

# 手动设置 cookie 并测试
print("Testing with explicit cookie header...")
cookie_value = s.cookies.get('session')
headers = {'Cookie': f'session={cookie_value}'}
r = requests.get("http://localhost:8000/admin-api/dashboard", 
    headers=headers, allow_redirects=False)
print(f"Dashboard status: {r.status_code}")
