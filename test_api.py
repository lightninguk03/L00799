"""
快速测试 API 端点
运行: python test_api.py
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_root():
    print("测试根端点...")
    response = requests.get(f"{BASE_URL}/")
    print(f"状态码: {response.status_code}")
    print(f"响应: {response.json()}\n")

def test_system_config():
    print("测试系统配置...")
    response = requests.get(f"{BASE_URL}/system/config")
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), ensure_ascii=False, indent=2)}\n")

def test_register():
    print("测试用户注册...")
    data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    print(f"状态码: {response.status_code}")
    if response.status_code == 201:
        print(f"响应: {json.dumps(response.json(), ensure_ascii=False, indent=2)}\n")
        return True
    else:
        print(f"错误: {response.text}\n")
        return False

def test_login():
    print("测试用户登录...")
    data = {
        "username": "test@example.com",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", data=data)
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"获取到 Token: {token[:50]}...\n")
        return token
    else:
        print(f"错误: {response.text}\n")
        return None

def test_create_post(token):
    print("测试创建动态...")
    headers = {"Authorization": f"Bearer {token}"}
    data = {"content": "这是一条测试动态！"}
    response = requests.post(f"{BASE_URL}/posts/", json=data, headers=headers)
    print(f"状态码: {response.status_code}")
    if response.status_code == 201:
        print(f"响应: {json.dumps(response.json(), ensure_ascii=False, indent=2)}\n")
        return response.json()["id"]
    else:
        print(f"错误: {response.text}\n")
        return None

def test_get_posts():
    print("测试获取动态列表...")
    response = requests.get(f"{BASE_URL}/posts/")
    print(f"状态码: {response.status_code}")
    print(f"动态数量: {len(response.json())}\n")

if __name__ == "__main__":
    print("=" * 50)
    print("Project Neon API 测试")
    print("=" * 50 + "\n")

    try:
        test_root()
        test_system_config()

        if test_register():
            token = test_login()
            if token:
                post_id = test_create_post(token)
                test_get_posts()

        print("✅ 测试完成！")
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请确保服务已启动（运行 start.bat 或 start.sh）")
    except Exception as e:
        print(f"❌ 测试失败: {e}")
