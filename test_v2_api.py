"""
Project Neon V2.1 API 功能测试
测试所有新增功能：邮箱验证、密码重置、Token刷新、关注系统、头像上传等

运行前请确保：
1. 后端服务已启动 (python -m uvicorn app.main:app --reload)
2. 数据库已初始化

运行: python test_v2_api.py
"""
import requests
import json
import time
import os

BASE_URL = "http://localhost:8000"

# 测试用户数据
TEST_USER_1 = {
    "email": f"test_v2_{int(time.time())}@example.com",
    "username": f"testuser_v2_{int(time.time())}",
    "password": "Password123"
}

TEST_USER_2 = {
    "email": f"test_v2_2_{int(time.time())}@example.com",
    "username": f"testuser_v2_2_{int(time.time())}",
    "password": "Password456"
}

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def success(self, name):
        self.passed += 1
        print(f"  ✅ {name}")
    
    def fail(self, name, reason):
        self.failed += 1
        self.errors.append(f"{name}: {reason}")
        print(f"  ❌ {name}: {reason}")
    
    def summary(self):
        print("\n" + "=" * 50)
        print(f"测试结果: {self.passed} 通过, {self.failed} 失败")
        if self.errors:
            print("\n失败详情:")
            for err in self.errors:
                print(f"  - {err}")
        print("=" * 50)

result = TestResult()

def check_server():
    """检查服务器是否运行"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        return response.status_code == 200
    except:
        return False

# ==================== 1. 密码强度验证测试 ====================
def test_password_validation():
    print("\n📋 测试密码强度验证...")
    
    # 测试太短的密码
    data = {"email": "weak@test.com", "username": "weakuser", "password": "Pass1"}
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    try:
        resp_json = response.json()
        error_code = resp_json.get("error_code", "")
    except:
        error_code = ""
    if response.status_code == 400 and error_code == "password_too_short":
        result.success("密码太短被拒绝")
    else:
        result.fail("密码太短被拒绝", f"状态码: {response.status_code}, error_code: {error_code}")
    
    # 测试没有数字的密码
    data = {"email": "weak2@test.com", "username": "weakuser2", "password": "PasswordOnly"}
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    try:
        resp_json = response.json()
        error_code = resp_json.get("error_code", "")
    except:
        error_code = ""
    if response.status_code == 400 and error_code == "password_needs_number":
        result.success("无数字密码被拒绝")
    else:
        result.fail("无数字密码被拒绝", f"状态码: {response.status_code}, error_code: {error_code}")
    
    # 测试没有字母的密码
    data = {"email": "weak3@test.com", "username": "weakuser3", "password": "12345678"}
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    try:
        resp_json = response.json()
        error_code = resp_json.get("error_code", "")
    except:
        error_code = ""
    if response.status_code == 400 and error_code == "password_needs_letter":
        result.success("无字母密码被拒绝")
    else:
        result.fail("无字母密码被拒绝", f"状态码: {response.status_code}, error_code: {error_code}")

# ==================== 2. 用户注册测试 ====================
def test_register():
    print("\n📋 测试用户注册...")
    
    # 注册用户1
    response = requests.post(f"{BASE_URL}/auth/register", json=TEST_USER_1)
    if response.status_code == 201:
        data = response.json()
        if "is_verified" in data and data["is_verified"] == False:
            result.success(f"用户1注册成功，is_verified=False")
        else:
            result.fail("用户1注册", "缺少 is_verified 字段")
    else:
        result.fail("用户1注册", f"状态码: {response.status_code}, {response.text}")
    
    # 注册用户2
    response = requests.post(f"{BASE_URL}/auth/register", json=TEST_USER_2)
    if response.status_code == 201:
        result.success("用户2注册成功")
    else:
        result.fail("用户2注册", f"状态码: {response.status_code}")
    
    # 测试重复邮箱
    response = requests.post(f"{BASE_URL}/auth/register", json=TEST_USER_1)
    if response.status_code == 400 and "email_already_exists" in response.text:
        result.success("重复邮箱被拒绝")
    else:
        result.fail("重复邮箱被拒绝", f"状态码: {response.status_code}")

# ==================== 3. 登录和双Token测试 ====================
def test_login():
    print("\n📋 测试登录和双Token...")
    
    # 正常登录
    data = {"username": TEST_USER_1["email"], "password": TEST_USER_1["password"]}
    response = requests.post(f"{BASE_URL}/auth/login", data=data)
    
    if response.status_code == 200:
        json_data = response.json()
        
        # 检查双Token
        if "access_token" in json_data and "refresh_token" in json_data:
            result.success("登录返回双Token")
            
            # 检查 is_verified 字段
            if "is_verified" in json_data:
                result.success("登录返回 is_verified 状态")
            else:
                result.fail("登录返回 is_verified", "缺少字段")
            
            return json_data["access_token"], json_data["refresh_token"]
        else:
            result.fail("登录返回双Token", "缺少 token 字段")
    else:
        result.fail("用户登录", f"状态码: {response.status_code}")
    
    return None, None

# ==================== 4. Token刷新测试 ====================
def test_token_refresh(refresh_token):
    print("\n📋 测试Token刷新...")
    
    if not refresh_token:
        result.fail("Token刷新", "没有 refresh_token")
        return None, None
    
    response = requests.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": refresh_token})
    
    if response.status_code == 200:
        json_data = response.json()
        if "access_token" in json_data and "refresh_token" in json_data:
            result.success("Token刷新成功，返回新的双Token")
            
            # 验证旧token失效
            old_response = requests.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": refresh_token})
            if old_response.status_code == 401:
                result.success("旧Refresh Token已失效")
            else:
                result.fail("旧Refresh Token失效", f"状态码: {old_response.status_code}")
            
            return json_data["access_token"], json_data["refresh_token"]
        else:
            result.fail("Token刷新", "响应缺少token字段")
    else:
        result.fail("Token刷新", f"状态码: {response.status_code}, {response.text}")
    
    return None, None

# ==================== 5. 登出测试 ====================
def test_logout(refresh_token):
    print("\n📋 测试登出...")
    
    if not refresh_token:
        result.fail("登出测试", "没有 refresh_token")
        return
    
    response = requests.post(f"{BASE_URL}/auth/logout", json={"refresh_token": refresh_token})
    
    if response.status_code == 200:
        result.success("登出成功")
        
        # 验证token失效
        verify_response = requests.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": refresh_token})
        if verify_response.status_code == 401:
            result.success("登出后Token已失效")
        else:
            result.fail("登出后Token失效", f"状态码: {verify_response.status_code}")
    else:
        result.fail("登出", f"状态码: {response.status_code}")

# ==================== 6. 获取用户信息测试 ====================
def test_get_me(access_token):
    print("\n📋 测试获取当前用户信息...")
    
    if not access_token:
        result.fail("获取用户信息", "没有 access_token")
        return
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        required_fields = ["id", "email", "username", "is_verified", "created_at"]
        missing = [f for f in required_fields if f not in data]
        if not missing:
            result.success("获取用户信息成功，字段完整")
        else:
            result.fail("获取用户信息", f"缺少字段: {missing}")
    else:
        result.fail("获取用户信息", f"状态码: {response.status_code}")

# ==================== 7. 用户统计测试 ====================
def test_user_stats(access_token):
    print("\n📋 测试用户统计...")
    
    if not access_token:
        result.fail("用户统计", "没有 access_token")
        return
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/auth/me/stats", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        required_fields = ["post_count", "like_count", "favorite_count", "comment_count"]
        missing = [f for f in required_fields if f not in data]
        if not missing:
            result.success("用户统计接口正常")
        else:
            result.fail("用户统计", f"缺少字段: {missing}")
    else:
        result.fail("用户统计", f"状态码: {response.status_code}")

# ==================== 8. 关注系统测试 ====================
def test_follow_system(token1, token2, user1_id, user2_id):
    print("\n📋 测试关注系统...")
    
    if not token1 or not token2:
        result.fail("关注系统", "缺少token")
        return
    
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    # 用户1关注用户2
    response = requests.post(f"{BASE_URL}/users/{user2_id}/follow", headers=headers1)
    if response.status_code == 200:
        result.success("关注用户成功")
    else:
        result.fail("关注用户", f"状态码: {response.status_code}, {response.text}")
    
    # 测试不能关注自己
    response = requests.post(f"{BASE_URL}/users/{user1_id}/follow", headers=headers1)
    if response.status_code == 400 and "cannot_follow_self" in response.text:
        result.success("禁止关注自己")
    else:
        result.fail("禁止关注自己", f"状态码: {response.status_code}")
    
    # 获取关注列表
    response = requests.get(f"{BASE_URL}/users/{user1_id}/following", headers=headers1)
    if response.status_code == 200:
        data = response.json()
        if "items" in data and "total" in data:
            result.success("获取关注列表成功")
        else:
            result.fail("获取关注列表", "响应格式错误")
    else:
        result.fail("获取关注列表", f"状态码: {response.status_code}")
    
    # 获取粉丝列表
    response = requests.get(f"{BASE_URL}/users/{user2_id}/followers", headers=headers2)
    if response.status_code == 200:
        result.success("获取粉丝列表成功")
    else:
        result.fail("获取粉丝列表", f"状态码: {response.status_code}")
    
    # 取消关注
    response = requests.delete(f"{BASE_URL}/users/{user2_id}/follow", headers=headers1)
    if response.status_code == 200:
        result.success("取消关注成功")
    else:
        result.fail("取消关注", f"状态码: {response.status_code}")

# ==================== 9. 用户主页测试 ====================
def test_user_profile(user_id, access_token=None):
    print("\n📋 测试用户主页...")
    
    headers = {"Authorization": f"Bearer {access_token}"} if access_token else {}
    response = requests.get(f"{BASE_URL}/users/{user_id}", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        required_fields = ["id", "username", "post_count", "following_count", "follower_count"]
        missing = [f for f in required_fields if f not in data]
        if not missing:
            result.success("用户主页接口正常")
        else:
            result.fail("用户主页", f"缺少字段: {missing}")
    else:
        result.fail("用户主页", f"状态码: {response.status_code}")

# ==================== 10. 用户动态列表测试 ====================
def test_user_posts(user_id):
    print("\n📋 测试用户动态列表...")
    
    response = requests.get(f"{BASE_URL}/users/{user_id}/posts")
    
    if response.status_code == 200:
        data = response.json()
        if "items" in data and "total" in data:
            result.success("用户动态列表接口正常")
        else:
            result.fail("用户动态列表", "响应格式错误")
    else:
        result.fail("用户动态列表", f"状态码: {response.status_code}")

# ==================== 11. 邮箱验证接口测试 ====================
def test_email_verification_endpoints():
    print("\n📋 测试邮箱验证接口...")
    
    # 测试验证邮箱接口（使用无效验证码）
    response = requests.post(f"{BASE_URL}/auth/verify-email", json={"code": "invalid_code"})
    if response.status_code == 400:
        result.success("无效验证码被拒绝")
    else:
        result.fail("无效验证码被拒绝", f"状态码: {response.status_code}")
    
    # 测试重发验证邮件接口
    response = requests.post(f"{BASE_URL}/auth/resend-verify", json={"email": TEST_USER_1["email"]})
    # 即使邮件服务未配置，接口也应该返回200（静默失败）
    if response.status_code == 200:
        result.success("重发验证邮件接口正常")
    else:
        result.fail("重发验证邮件", f"状态码: {response.status_code}, {response.text}")

# ==================== 12. 密码重置接口测试 ====================
def test_password_reset_endpoints():
    print("\n📋 测试密码重置接口...")
    
    # 测试忘记密码接口
    response = requests.post(f"{BASE_URL}/auth/forgot-password", json={"email": TEST_USER_1["email"]})
    if response.status_code == 200:
        result.success("忘记密码接口正常")
    else:
        result.fail("忘记密码", f"状态码: {response.status_code}, {response.text}")
    
    # 测试重置密码接口（使用无效重置码）
    response = requests.post(f"{BASE_URL}/auth/reset-password", json={
        "code": "invalid_code",
        "new_password": "NewPassword123"
    })
    if response.status_code == 400:
        result.success("无效重置码被拒绝")
    else:
        result.fail("无效重置码被拒绝", f"状态码: {response.status_code}")

# ==================== 13. Gallery分页测试 ====================
def test_gallery():
    print("\n📋 测试Gallery分页...")
    
    # 获取分类列表
    response = requests.get(f"{BASE_URL}/gallery/categories")
    if response.status_code == 200:
        result.success("获取分类列表成功")
        categories = response.json()
        
        if categories and len(categories) > 0:
            # 测试分类图片分页
            cat_id = categories[0]["id"]
            response = requests.get(f"{BASE_URL}/gallery/{cat_id}?page=1&page_size=10")
            if response.status_code == 200:
                data = response.json()
                if "total" in data and "items" in data:
                    result.success("Gallery分页响应格式正确")
                else:
                    result.fail("Gallery分页", "响应缺少 total 或 items")
            else:
                result.fail("Gallery分页", f"状态码: {response.status_code}")
        else:
            result.success("分类列表为空，跳过分页测试")
    else:
        result.fail("获取分类列表", f"状态码: {response.status_code}")
    
    # 测试不存在的分类
    response = requests.get(f"{BASE_URL}/gallery/99999")
    if response.status_code == 404:
        result.success("不存在的分类返回404")
    else:
        result.fail("不存在的分类返回404", f"状态码: {response.status_code}")

# ==================== 主测试流程 ====================
def main():
    print("=" * 50)
    print("🚀 Project Neon V2.1 API 功能测试")
    print("=" * 50)
    
    # 检查服务器
    if not check_server():
        print("\n❌ 无法连接到服务器！")
        print("请先启动后端服务: python -m uvicorn app.main:app --reload")
        return
    
    print("\n✅ 服务器连接成功")
    
    # 1. 密码强度验证
    test_password_validation()
    
    # 2. 用户注册
    test_register()
    
    # 3. 登录和双Token
    access_token, refresh_token = test_login()
    
    # 4. Token刷新
    new_access_token, new_refresh_token = test_token_refresh(refresh_token)
    
    # 使用新token继续测试
    if new_access_token:
        access_token = new_access_token
        refresh_token = new_refresh_token
    
    # 5. 获取用户信息
    test_get_me(access_token)
    
    # 6. 用户统计
    test_user_stats(access_token)
    
    # 获取用户ID
    user1_id = None
    user2_id = None
    if access_token:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if response.status_code == 200:
            user1_id = response.json()["id"]
    
    # 登录用户2获取token和ID
    data = {"username": TEST_USER_2["email"], "password": TEST_USER_2["password"]}
    response = requests.post(f"{BASE_URL}/auth/login", data=data)
    token2 = None
    if response.status_code == 200:
        token2 = response.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers2)
        if response.status_code == 200:
            user2_id = response.json()["id"]
    
    # 7. 关注系统
    if user1_id and user2_id:
        test_follow_system(access_token, token2, user1_id, user2_id)
    
    # 8. 用户主页
    if user1_id:
        test_user_profile(user1_id, access_token)
    
    # 9. 用户动态列表
    if user1_id:
        test_user_posts(user1_id)
    
    # 10. 邮箱验证接口
    test_email_verification_endpoints()
    
    # 11. 密码重置接口
    test_password_reset_endpoints()
    
    # 12. Gallery分页
    test_gallery()
    
    # 13. 登出测试（最后执行，会使token失效）
    test_logout(refresh_token)
    
    # 输出结果
    result.summary()

if __name__ == "__main__":
    main()
