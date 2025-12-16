"""
Project Neon 压力测试
使用 locust 进行高并发性能测试

安装: pip install locust
运行: locust -f tests/test_stress.py --host=http://localhost:8000
然后访问 http://localhost:8089 配置并发数
"""
from locust import HttpUser, task, between
import random
import string


def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase, k=length))


class ProjectNeonUser(HttpUser):
    """模拟普通用户行为"""
    wait_time = between(1, 3)  # 每个请求间隔 1-3 秒
    
    def on_start(self):
        """用户启动时注册并登录"""
        self.email = f"stress_{random_string()}@test.com"
        self.password = "Test123456"
        
        # 注册
        self.client.post("/auth/register", json={
            "email": self.email,
            "username": f"stress_{random_string()}",
            "password": self.password
        })
        
        # 登录
        resp = self.client.post("/auth/login", data={
            "username": self.email,
            "password": self.password
        })
        if resp.status_code == 200:
            self.token = resp.json().get("access_token")
        else:
            self.token = None
    
    @task(10)
    def get_posts(self):
        """获取动态列表（高频）"""
        self.client.get("/posts/")

    @task(5)
    def get_system_config(self):
        """获取系统配置（中频）"""
        self.client.get("/system/config")
    
    @task(3)
    def get_my_info(self):
        """获取个人信息（中频）"""
        if self.token:
            self.client.get("/auth/me", headers={
                "Authorization": f"Bearer {self.token}"
            })
    
    @task(2)
    def create_post(self):
        """发布动态（低频）"""
        if self.token:
            self.client.post("/posts/", 
                headers={"Authorization": f"Bearer {self.token}"},
                data={"content": f"压力测试动态 {random_string()}"})
    
    @task(1)
    def search_posts(self):
        """搜索动态（低频）"""
        self.client.get("/search/posts", params={"q": "测试"})


class AdminUser(HttpUser):
    """模拟管理员行为"""
    wait_time = between(2, 5)
    weight = 1  # 管理员数量较少
    
    def on_start(self):
        """管理员登录"""
        self.session = self.client
        self.session.post("/admin/login", data={
            "username": "admin",
            "password": "Admin123"
        })
    
    @task(5)
    def view_dashboard(self):
        """查看仪表盘"""
        self.session.get("/admin/dashboard")
    
    @task(3)
    def view_users(self):
        """查看用户列表"""
        self.session.get("/admin/user/list")
    
    @task(2)
    def view_posts(self):
        """查看动态列表"""
        self.session.get("/admin/post/list")
