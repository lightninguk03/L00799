# 管理后台设计文档

## 概述

为 Project Neon V2.0 添加基于 SQLAdmin 的可视化管理后台。SQLAdmin 是专为 FastAPI + SQLModel/SQLAlchemy 设计的管理界面库，可以快速生成 CRUD 界面，最小化开发成本。

### 设计目标

1. **快速实现** - 利用 SQLAdmin 自动生成界面，减少开发量
2. **易于维护** - 非技术人员可以直接使用
3. **安全可控** - 独立的管理员认证系统
4. **中文友好** - 全中文界面

## 系统架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Project Neon                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐    ┌────────────────────────────────────┐     │
│  │   FastAPI App    │    │         SQLAdmin 管理后台          │     │
│  │   (现有 API)      │    │         /admin/*                  │     │
│  │                  │    │                                    │     │
│  │  /auth/*         │    │  ┌──────────────────────────────┐ │     │
│  │  /posts/*        │    │  │  数据管理                      │ │     │
│  │  /gallery/*      │    │  │  - 用户管理                    │ │     │
│  │  /ai/*           │    │  │  - 动态管理                    │ │     │
│  │  /system/config  │◄───┼──│  - 分类管理                    │ │     │
│  │  /notifications/*│    │  │  - 评论管理                    │ │     │
│  │  /search/*       │    │  │  - 通知管理                    │ │     │
│  │                  │    │  └──────────────────────────────┘ │     │
│  └──────────────────┘    │                                    │     │
│                          │  ┌──────────────────────────────┐ │     │
│                          │  │  网站配置                      │ │     │
│                          │  │  - 外观设置 (Logo/背景/颜色)   │ │     │
│                          │  │  - 内容设置 (名称/标签/按钮)   │ │     │
│                          │  │  - 链接管理 (社交/页脚)        │ │     │
│                          │  │  - 媒体库 (图片上传管理)       │ │     │
│                          │  └──────────────────────────────┘ │     │
│                          │                                    │     │
│                          │  ┌──────────────────────────────┐ │     │
│                          │  │  系统功能                      │ │     │
│                          │  │  - 仪表盘 (统计概览)           │ │     │
│                          │  │  - 数据报表 (图表/导出)        │ │     │
│                          │  │  - 管理员管理                  │ │     │
│                          │  └──────────────────────────────┘ │     │
│                          └────────────────────────────────────┘     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      SQLite 数据库                            │   │
│  │  users | posts | categories | comments | notifications        │   │
│  │  + admin_users (管理员)                                       │   │
│  │  + site_configs (网站配置)                                    │   │
│  │  + media (媒体库)                                             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| 管理框架 | SQLAdmin | 专为 FastAPI 设计，与 SQLModel 完美集成 |
| 认证方式 | Session-based | SQLAdmin 内置支持，适合后台场景 |
| 密码加密 | bcrypt | 复用现有安全模块 |

## 组件和接口

### 1. 管理员用户模型 (新增)

```python
# app/models/admin_user.py
class AdminRole(str, Enum):
    SUPER_ADMIN = "super_admin"  # 超级管理员
    OPERATOR = "operator"        # 运营人员

class AdminUser(SQLModel, table=True):
    __tablename__ = "admin_users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    role: AdminRole = Field(default=AdminRole.OPERATOR)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
```

### 2. 管理员认证

```python
# app/admin/auth.py
class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        # 验证用户名密码
        # 创建 session
        
    async def logout(self, request: Request) -> bool:
        # 清除 session
        
    async def authenticate(self, request: Request) -> Optional[AdminUser]:
        # 验证 session，返回当前管理员
```

### 3. 数据模型视图

#### 用户管理 (UserAdmin)
```python
class UserAdmin(ModelView, model=User):
    name = "用户"
    name_plural = "用户管理"
    icon = "fa-solid fa-user"
    
    column_list = [User.id, User.username, User.email, User.avatar, User.created_at]
    column_searchable_list = [User.username, User.email]
    column_sortable_list = [User.id, User.username, User.created_at]
    
    form_excluded_columns = [User.password_hash]  # 不允许直接编辑密码
    
    can_delete = False  # 默认禁止删除，super_admin 可覆盖
```

#### 动态管理 (PostAdmin)
```python
class PostAdmin(ModelView, model=Post):
    name = "动态"
    name_plural = "动态管理"
    icon = "fa-solid fa-newspaper"
    
    column_list = [Post.id, Post.content, Post.media_type, Post.category_id, Post.created_at]
    column_searchable_list = [Post.content]
    column_sortable_list = [Post.id, Post.created_at, Post.view_count]
```

#### 分类管理 (CategoryAdmin)
```python
class CategoryAdmin(ModelView, model=Category):
    name = "分类"
    name_plural = "番剧分类"
    icon = "fa-solid fa-folder"
    
    column_list = [Category.id, Category.name, 
    icon = "fa-solid fa-folder"
    
    column_list = [Category.id, Category.name, Category.cover_image]
    
    async def on_model_delete(self, model):
        # 检查是否有关联帖子，阻止删除
```

#### CommentAdmin
```python
class CommentAdmin(ModelView, model=Comment):
    name = "评论"
    name_plural = "评论管理"
    icon = "fa-solid fa-comment"
    
    column_list = [Comment.id, Comment.content, Comment.user_id, Comment.post_id, Comment.created_at]
    column_searchable_list = [Comment.content]
```

#### NotificationAdmin
```python
class NotificationAdmin(ModelView, model=Notification):
    name = "通知"
    name_plural = "通知管理"
    icon = "fa-solid fa-bell"
    
    column_list = [Notification.id, Notification.type, Notification.user_id, Notification.is_read]
```

### 4. Site Configuration Model (新增)

```python
# app/models/site_config.py
class SiteConfig(SQLModel, table=True):
    __tablename__ = "site_configs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(unique=True, index=True)  # 配置键名
    value: str  # 配置值 (JSON 字符串存储复杂数据)
    category: str = Field(index=True)  # 分类: appearance, content, links, etc.
    description: str = ""  # 配置说明
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

**预设配置项：**

| key | category | 说明 |
|-----|----------|------|
| site_name | content | 网站名称 |
| site_description | content | 网站描述 |
| site_intro | content | 网站介绍文字 |
| logo_url | appearance | Logo 图片 URL |
| favicon_url | appearance | Favicon URL |
| background_url | appearance | 背景图片 URL |
| primary_color | appearance | 主题色 |
| nav_labels | content | 导航菜单标签 (JSON) |
| button_labels | content | 按钮文字 (JSON) |
| social_links | links | 社交链接 (JSON 数组) |
| footer_links | links | 页脚链接 (JSON 数组) |
| banner_images | appearance | 轮播图 (JSON 数组) |

### 5. Media Library Model (新增)

```python
# app/models/media.py
class Media(SQLModel, table=True):
    __tablename__ = "media"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    original_name: str
    file_path: str
    file_type: str  # image/video
    file_size: int  # bytes
    width: Optional[int] = None
    height: Optional[int] = None
    uploaded_by: int = Field(foreign_key="admin_users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### 6. Dashboard (Custom Index View)

```python
# app/admin/views.py
class DashboardView(BaseView):
    name = "仪表盘"
    icon = "fa-solid fa-chart-line"
    
    @expose("/", methods=["GET"])
    async def index(self, request: Request):
        stats = {
            "user_count": await get_user_count(),
            "post_count": await get_post_count(),
            "comment_count": await get_comment_count(),
            "today_posts": await get_today_posts_count(),
            "recent_users": await get_recent_users(5),
            "recent_posts": await get_recent_posts(5),
        }
        return templates.TemplateResponse("dashboard.html", {"stats": stats})

### 7. Site Settings Views (新增)

```python
# app/admin/views.py

class AppearanceSettingsView(BaseView):
    name = "外观设置"
    icon = "fa-solid fa-palette"
    
    @expose("/", methods=["GET", "POST"])
    async def index(self, request: Request):
        # GET: 显示当前外观配置
        # POST: 保存外观配置 (logo, favicon, background, colors)

class ContentSettingsView(BaseView):
    name = "内容设置"
    icon = "fa-solid fa-file-alt"
    
    @expose("/", methods=["GET", "POST"])
    async def index(self, request: Request):
        # 管理网站名称、描述、导航标签、按钮文字等

class LinksSettingsView(BaseView):
    name = "链接管理"
    icon = "fa-solid fa-link"
    
    @expose("/", methods=["GET", "POST"])
    async def index(self, request: Request):
        # 管理社交链接、页脚链接

class MediaLibraryView(BaseView):
    name = "媒体库"
    icon = "fa-solid fa-images"
    
    @expose("/", methods=["GET"])
    async def index(self, request: Request):
        # 显示所有上传的图片
    
    @expose("/upload", methods=["POST"])
    async def upload(self, request: Request):
        # 处理图片上传

class ReportsView(BaseView):
    name = "数据报表"
    icon = "fa-solid fa-chart-bar"
    
    @expose("/", methods=["GET"])
    async def index(self, request: Request):
        # 显示统计图表
    
    @expose("/export", methods=["GET"])
    async def export(self, request: Request):
        # 导出 CSV
```
```

## Data Models

### SiteConfig 表结构

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 配置 ID |
| key | VARCHAR(100) | UNIQUE, NOT NULL | 配置键名 |
| value | TEXT | NOT NULL | 配置值 (支持 JSON) |
| category | VARCHAR(50) | NOT NULL | 分类 |
| description | VARCHAR(255) | NULL | 说明 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

### Media 表结构

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 媒体 ID |
| filename | VARCHAR(255) | NOT NULL | 存储文件名 |
| original_name | VARCHAR(255) | NOT NULL | 原始文件名 |
| file_path | VARCHAR(500) | NOT NULL | 文件路径 |
| file_type | VARCHAR(50) | NOT NULL | 文件类型 |
| file_size | INTEGER | NOT NULL | 文件大小 |
| width | INTEGER | NULL | 图片宽度 |
| height | INTEGER | NULL | 图片高度 |
| uploaded_by | INTEGER | FK | 上传者 ID |
| created_at | DATETIME | NOT NULL | 上传时间 |

### AdminUser 表结构

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 管理员 ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| role | ENUM | NOT NULL | 角色 (super_admin/operator) |
| is_active | BOOLEAN | NOT NULL | 是否启用 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| last_login | DATETIME | NULL | 最后登录时间 |

### 权限矩阵

| 功能 | Super Admin | Operator |
|------|-------------|----------|
| 查看用户 | ✅ | ✅ |
| 编辑用户 | ✅ | ✅ |
| 删除用户 | ✅ | ❌ |
| 管理动态 | ✅ | ✅ |
| 管理分类 | ✅ | ✅ |
| 管理评论 | ✅ | ✅ |
| 管理通知 | ✅ | ✅ |
| 管理管理员 | ✅ | ❌ |
| 查看仪表盘 | ✅ | ✅ |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: User search returns matching results
*For any* search query string, all returned users should have username or email containing the search term (case-insensitive)
**Validates: Requirements 1.2**

### Property 2: User statistics accuracy
*For any* user, the displayed post count should equal the actual count of posts with that user_id in the database
**Validates: Requirements 1.3**

### Property 3: Post filter consistency
*For any* filter combination (category, media_type, date_range), all returned posts should match all specified filter criteria
**Validates: Requirements 2.2**

### Property 4: Post deletion cascade
*For any* post deletion, all comments and interactions associated with that post_id should also be deleted
**Validates: Requirements 2.4**

### Property 5: Category name uniqueness
*For any* category creation or update, if the name already exists for a different category, the operation should be rejected
**Validates: Requirements 3.2**

### Property 6: Category deletion protection
*For any* category with associated posts (count > 0), deletion should be prevented
**Validates: Requirements 3.4**

### Property 7: Comment deletion isolation
*For any* comment deletion, the parent post should remain unchanged in the database
**Validates: Requirements 4.3**

### Property 8: Admin authentication requirement
*For any* admin panel request without valid session, the response should redirect to login page (HTTP 302 or 401)
**Validates: Requirements 5.1**

### Property 9: Password hashing
*For any* admin user creation, the stored password_hash should not equal the plaintext password and should be verifiable with bcrypt
**Validates: Requirements 5.2**

### Property 10: Role-based access control
*For any* operator role admin, requests to user deletion or admin management endpoints should be denied (HTTP 403)
**Validates: Requirements 5.5**

### Property 11: Dashboard statistics consistency
*For any* dashboard view, the displayed total counts should equal the actual row counts in respective database tables
**Validates: Requirements 6.1**

### Property 12: Site config persistence
*For any* site configuration update, reading the same config key should return the updated value
**Validates: Requirements 8.4, 9.4**

### Property 13: Media upload validation
*For any* uploaded file, if the file type is not in allowed types (image/jpeg, image/png, image/gif, image/webp), the upload should be rejected
**Validates: Requirements 11.2**

### Property 14: Config API consistency
*For any* site configuration, the value returned by the public API `/system/config` should match the value stored in the database
**Validates: Requirements 8.4**

## Error Handling

### 认证错误
- 未登录访问 → 重定向到登录页
- 密码错误 → 显示"用户名或密码错误"
- 账户禁用 → 显示"账户已被禁用"

### 权限错误
- 无权限操作 → 显示"您没有权限执行此操作"
- 尝试删除受保护数据 → 显示具体原因（如"该分类下有 X 个帖子"）

### 数据错误
- 重复数据 → 显示"该名称已存在"
- 关联数据缺失 → 显示"关联数据不存在"

## Testing Strategy

### 单元测试
- 测试 AdminAuth 的登录/登出逻辑
- 测试权限检查函数
- 测试统计计算函数

### 属性测试
使用 **Hypothesis** 库进行属性测试：
- 搜索功能的正确性
- 过滤功能的正确性
- 级联删除的完整性
- 权限控制的严格性

### 集成测试
- 完整的登录流程测试
- CRUD 操作流程测试
- 权限边界测试

### 测试配置
```python
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_functions = test_*

# 属性测试配置
hypothesis_settings = {
    "max_examples": 100,
    "deadline": None
}
```
