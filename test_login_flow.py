"""测试登录流程"""
import requests

s = requests.Session()

# 1. 获取登录页面
print("1. GET /admin/login")
r = s.get("http://localhost:8000/admin/login")
print(f"   Status: {r.status_code}")

# 2. 提交登录
print("\n2. POST /admin/login")
r = s.post("http://localhost:8000/admin/login", 
    data={"username": "admin", "password": "Admin123"},
    allow_redirects=False)
print(f"   Status: {r.status_code}")
print(f"   Location: {r.headers.get('location', 'N/A')}")
print(f"   Cookies: {dict(s.cookies)}")

# 3. 跟随重定向到 /admin/
if r.status_code == 302:
    print("\n3. Following redirect to /admin/")
    r = s.get(r.headers["location"], allow_redirects=False)
    print(f"   Status: {r.status_code}")
    print(f"   Location: {r.headers.get('location', 'N/A')}")
    
    # 4. 如果又重定向到登录页，说明 session 丢失
    if r.status_code == 302 and "login" in r.headers.get("location", ""):
        print("\n   ❌ Session 丢失! 被重定向回登录页")
    else:
        print("\n   ✅ 登录成功!")

# 5. 测试访问仪表盘
print("\n4. GET /admin-api/dashboard")
r = s.get("http://localhost:8000/admin-api/dashboard", allow_redirects=False)
print(f"   Status: {r.status_code}")
if r.status_code == 200:
    print("   ✅ 仪表盘访问成功!")
else:
    print(f"   ❌ 失败，重定向到: {r.headers.get('location', 'N/A')}")
