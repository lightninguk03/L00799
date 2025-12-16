"""
Project Neon 集成测试
测试多个模块协作，使用真实数据库

运行: pytest tests/test_integration.py -v
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime


@pytest.fixture(scope="module")
def client():
    """创建测试客户端"""
    from app.main import app
    return TestClient(app)


@pytest.fixture(scope="module")
def test_user(client):
    """创建测试用户并返回 token"""
    timestamp = int(datetime.now().timestamp())
    email = f"integration_test_{timestamp}@example.com"
    password = "Test123456"
    
    # 注册
    resp = client.post("/auth/register", json={
        "email": email,
        "username": f"inttest_{timestamp}",
        "password": password
    })
    assert resp.status_code == 201
    
    # 登录
    resp = client.post("/auth/login", data={
        "username": email,
        "password": password
    })
    assert resp.status_code == 200
    data = resp.json()
    
    return {
        "email": email,
        "access_token": data["access_token"],
        "refresh_token": data["refresh_token"]
    }


class TestUserFlow:
    """测试用户完整流程"""
    
    def test_register_login_flow(self, client):
        """测试注册-登录流程"""
        timestamp = int(datetime.now().timestamp())
        email = f"flow_test_{timestamp}@example.com"
        password = "Test123456"
        
        # 1. 注册
        resp = client.post("/auth/register", json={
            "email": email,
            "username": f"flowtest_{timestamp}",
            "password": password
        })
        assert resp.status_code == 201
        user_data = resp.json()
        assert user_data["email"] == email
        
        # 2. 登录
        resp = client.post("/auth/login", data={
            "username": email,
            "password": password
        })
        assert resp.status_code == 200
        tokens = resp.json()
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        
        # 3. 获取用户信息
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        resp = client.get("/auth/me", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == email


class TestPostFlow:
    """测试动态完整流程"""
    
    def test_create_interact_flow(self, client, test_user):
        """测试发帖-互动流程"""
        headers = {"Authorization": f"Bearer {test_user['access_token']}"}
        
        # 1. 发帖
        resp = client.post("/posts/", headers=headers, data={
            "content": "集成测试动态"
        })
        assert resp.status_code == 201
        post = resp.json()
        post_id = post["id"]
        
        # 2. 获取动态详情
        resp = client.get(f"/posts/{post_id}")
        assert resp.status_code == 200
        
        # 3. 点赞
        resp = client.post(f"/posts/{post_id}/interact", headers=headers, json={
            "interaction_type": "like"
        })
        assert resp.status_code == 200
        assert resp.json()["action"] == "added"
        
        # 4. 评论
        resp = client.post(f"/posts/{post_id}/comments", headers=headers, json={
            "content": "测试评论"
        })
        assert resp.status_code == 201


class TestSearchFlow:
    """测试搜索流程"""
    
    def test_search_posts(self, client):
        """测试搜索动态"""
        resp = client.get("/search/posts", params={"q": "测试"})
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data
    
    def test_search_users(self, client):
        """测试搜索用户"""
        resp = client.get("/search/users", params={"q": "test"})
        assert resp.status_code == 200


class TestNotificationFlow:
    """测试通知流程"""
    
    def test_get_notifications(self, client, test_user):
        """测试获取通知"""
        headers = {"Authorization": f"Bearer {test_user['access_token']}"}
        resp = client.get("/notifications/", headers=headers)
        assert resp.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
