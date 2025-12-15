"""
测试仪表盘和数据报表功能
"""
import requests

BASE_URL = "http://localhost:8000"

def main():
    print("=" * 50)
    print("测试仪表盘和数据报表")
    print("=" * 50)
    
    session = requests.Session()
    
    # 登录 - 不跟随重定向以保持 session cookie
    r = session.post(f"{BASE_URL}/admin/login", data={
        "username": "admin",
        "password": "Admin123"
    }, allow_redirects=False)
    
    login_success = r.status_code == 302 and "session" in session.cookies
    print(f"\n登录: {'成功 ✅' if login_success else '失败 ❌'}")
    if not login_success:
        print(f"  状态码: {r.status_code}")
        print(f"  Cookies: {dict(session.cookies)}")
        return
    
    # 测试仪表盘
    r = session.get(f"{BASE_URL}/admin-api/dashboard", allow_redirects=False)
    is_ok = r.status_code == 200
    status = "✅" if is_ok else "❌"
    print(f"仪表盘: {r.status_code} {status}")
    if not is_ok:
        print(f"  重定向到: {r.headers.get('location', 'N/A')}")
    
    # 测试报表
    r = session.get(f"{BASE_URL}/admin-api/reports", allow_redirects=False)
    is_ok = r.status_code == 200
    status = "✅" if is_ok else "❌"
    print(f"数据报表: {r.status_code} {status}")
    if not is_ok:
        print(f"  重定向到: {r.headers.get('location', 'N/A')}")
    
    # 测试报表时间范围
    r = session.get(f"{BASE_URL}/admin-api/reports?days=30", allow_redirects=False)
    is_ok = r.status_code == 200
    status = "✅" if is_ok else "❌"
    print(f"报表(30天): {r.status_code} {status}")
    
    # 测试 CSV 导出
    r = session.get(f"{BASE_URL}/admin-api/reports?export=users", allow_redirects=False)
    ct = r.headers.get("content-type", "")
    cd = r.headers.get("content-disposition", "")
    is_csv = "text/csv" in ct and "attachment" in cd
    status = "✅" if is_csv else "❌"
    print(f"导出用户CSV: {r.status_code} {status}")
    print(f"  Content-Type: {ct}")
    print(f"  Content-Disposition: {cd}")
    if is_csv:
        # 显示前几行数据
        lines = r.text.strip().split('\n')[:3]
        print(f"  数据预览: {lines}")
    
    r = session.get(f"{BASE_URL}/admin-api/reports?export=posts", allow_redirects=False)
    ct = r.headers.get("content-type", "")
    is_csv = "text/csv" in ct
    status = "✅" if is_csv else "❌"
    print(f"导出动态CSV: {r.status_code} {status}")
    
    r = session.get(f"{BASE_URL}/admin-api/reports?export=comments", allow_redirects=False)
    ct = r.headers.get("content-type", "")
    is_csv = "text/csv" in ct
    status = "✅" if is_csv else "❌"
    print(f"导出评论CSV: {r.status_code} {status}")
    
    print("\n" + "=" * 50)
    print("测试完成!")
    print("=" * 50)

if __name__ == "__main__":
    main()
