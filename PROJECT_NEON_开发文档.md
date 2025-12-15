# Project Neon V2.4.1 后端开发详细文档

## 📋 目录
1. [项目概述](#项目概述)
2. [技术架构详解](#技术架构详解)
3. [数据库设计详解](#数据库设计详解)
4. [API 接口详细规范](#api-接口详细规范)
5. [核心模块实现指南](#核心模块实现指南)
6. [安全性设计](#安全性设计)
7. [性能优化方案](#性能优化方案)
8. [部署指南](#部署指南)

---

## 1. 项目概述

### 1.1 项目定位
Project Neon 是一个面向 ACG 爱好者的社区平台，集成了：
- 社交动态分享（类似微博/Twitter）
- 图片/视频内容管理（类似 Pinterest）
- AI 智能助手（类似 ChatGPT）

### 1.2 核心特性
- **轻量级**：使用 SQLite，无需复杂数据库配置
- **高性能**：FastAPI 异步处理，支持高并发
- **易扩展**：模块化设计，便于功能迭代
- **AI 驱动**：集成 LLM，提供智能交互

### 1.3 技术选型理由
- **FastAPI**：现代化、高性能、自动生成 API 文档
- **SQLModel**：结合 SQLAlchemy 和 Pydantic，类型安全
- **JWT**：无状态认证，适合前后端分离
- **OpenAI API**：兼容多种 LLM 提供商

---

## 2. 技术架构详解

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                     前端 (React/Vue)                     │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   API Gateway (FastAPI)                  │
│  ┌──────────┬──────────┬──────────┬──────────┬────────┐ │
│  │  Auth    │  Posts   │  Gallery │  AI Chat │ Upload │ │
│  └──────────┴──────────┴──────────┴──────────┴────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ SQLite  │  │  Files  │  │ OpenAI  │
   │   DB    │  │ Storage │  │   API   │
   └─────────┘  └─────────┘  └─────────┘
```

### 2.2 分层架构

```
app/
├── api/          # 路由层 - 处理 HTTP 请求
├── services/     # 业务逻辑层 - 核心业务处理
├── models/       # 数据模型层 - 数据库表定义
├── schemas/      # 数据传输层 - 请求/响应模型
├── core/         # 核心功能层 - 认证、安全、配置
└── utils/        # 工具层 - 辅助函数
```

### 2.3 请求处理流程

```
客户端请求
    ↓
CORS 中间件
    ↓
JWT 认证 (如需要)
    ↓
路由处理器 (API Layer)
    ↓
业务逻辑 (Service Layer)
    ↓
数据访问 (Model Layer)
    ↓
数据库 / 外部服务
    ↓
响应返回客户端
```

---

## 3. 数据库设计详解

### 3.1 ER 关系图

```
User ──┬─── Post ──┬─── Comment
       │           ├─── Interaction (Like/Favorite)
       │           └─── Category
       │
       └─── ChatMessage
```

### 3.2 详细表结构

#### 3.2.1 User 表（用户）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, AUTO | 用户 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱 |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| avatar | VARCHAR(500) | NULL | 头像 URL |
| created_at | DATETIME | NOT NULL | 创建时间 |

**索引**：
- `idx_user_email` ON email
- `idx_user_username` ON username

#### 3.2.2 Category 表（番剧分类）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, AUTO | 分类 ID |
| name | VARCHAR(100) | UNIQUE, NOT NULL | 分类名称 |
| cover_image | VARCHAR(500) | NULL | 封面图 |

#### 3.2.3 Post 表（动态）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, AUTO | 动态 ID |
| user_id | INTEGER | FK(User.id), NOT NULL | 作者 ID |
| content | TEXT | NOT NULL | 文本内容 |
| media_type | ENUM | NOT NULL | 媒体类型 |
| media_urls | JSON | NULL | 媒体 URL 列表 |
| category_id | INTEGER | FK(Category.id), NULL | 分类 ID |
| repost_source_id | INTEGER | FK(Post.id), NULL | 转发源 ID |
| created_at | DATETIME | NOT NULL | 创建时间 |

**索引**：
- `idx_post_user` ON user_id
- `idx_post_category` ON category_id
- `idx_post_created` ON created_at DESC

**media_type 枚举值**：
- `text` - 纯文本
- `image` - 图片
- `video` - 视频

#### 3.2.4 Interaction 表（互动）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, AUTO | 互动 ID |
| user_id | INTEGER | FK(User.id), NOT NULL | 用户 ID |
| post_id | INTEGER | FK(Post.id), NOT NULL | 动态 ID |
| type | ENUM | NOT NULL | 互动类型 |

**唯一约束**：
- `UNIQUE(user_id, post_id, type)` - 防止重复互动

**type 枚举值**：
- `like` - 点赞
- `favorite` - 收藏

#### 3.2.5 Comment 表（评论）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, AUTO | 评论 ID |
| user_id | INTEGER | FK(User.id), NOT NULL | 用户 ID |
| post_id | INTEGER | FK(Post.id), NOT NULL | 动态 ID |
| content | TEXT | NOT NULL | 评论内容 |
| created_at | DATETIME | NOT NULL | 创建时间 |

**索引**：
- `idx_comment_post` ON post_id
- `idx_comment_created` ON created_at DESC

#### 3.2.6 ChatMessage 表（AI 对话记忆）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, AUTO | 消息 ID |
| user_id | INTEGER | FK(User.id), NOT NULL | 用户 ID |
| role | ENUM | NOT NULL | 角色 |
| content | TEXT | NOT NULL | 消息内容 |
| created_at | DATETIME | NOT NULL | 创建时间 |

**索引**：
- `idx_chat_user_created` ON (user_id, created_at DESC)

**role 枚举值**：
- `user` - 用户消息
- `assistant` - AI 回复

---

## 4. API 接口详细规范

### 4.1 认证模块 (Auth)

#### 4.1.1 用户注册

**端点**：`POST /auth/register`

**请求体**：
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

**响应**（成功 - 201）：
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "avatar": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**错误响应**：
- `400` - 邮箱或用户名已存在
- `422` - 数据验证失败

#### 4.1.2 用户登录

**端点**：`POST /auth/login`

**请求体**（OAuth2 Password Flow）：
```
username=user@example.com&password=password123
```

**响应**（成功 - 200）：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**错误响应**：
- `401` - 用户名或密码错误

---

### 4.2 社区动态模块 (Posts)

#### 4.2.1 发布动态

**端点**：`POST /posts/`

**认证**：需要 JWT Token

**请求体**（multipart/form-data）：
```
content: "这是一条动态"
category_id: 1
files: [file1.jpg, file2.jpg]  # 可选
```

**响应**（成功 - 201）：
```json
{
  "id": 1,
  "user_id": 1,
  "content": "这是一条动态",
  "media_type": "image",
  "media_urls": ["/uploads/images/xxx.jpg", "/uploads/images/yyy.jpg"],
  "category_id": 1,
  "repost_source_id": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### 4.2.2 获取动态列表

**端点**：`GET /posts/`

**查询参数**：
- `page` (int, default=1) - 页码
- `page_size` (int, default=20) - 每页数量
- `category_id` (int, optional) - 按分类筛选

**响应**（成功 - 200）：
```json
{
  "total": 100,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": 1,
      "user_id": 1,
      "author": {
        "id": 1,
        "username": "user1",
        "avatar": "/uploads/avatars/xxx.jpg"
      },
      "content": "动态内容",
      "media_type": "image",
      "media_urls": ["/uploads/images/xxx.jpg"],
      "category_id": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 4.2.3 点赞/收藏

**端点**：`POST /posts/{id}/interact`

**认证**：需要 JWT Token

**请求体**：
```json
{
  "type": "like"
}
```

**响应**（成功 - 200）：
```json
{
  "message": "操作成功",
  "action": "added"
}
```

#### 4.2.4 评论动态

**端点**：`POST /posts/{id}/comments`

**认证**：需要 JWT Token

**请求体**：
```json
{
  "content": "这是一条评论"
}
```

**响应**（成功 - 201）：
```json
{
  "id": 1,
  "user_id": 1,
  "post_id": 1,
  "content": "这是一条评论",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### 4.2.5 转发动态

**端点**：`POST /posts/{id}/repost`

**认证**：需要 JWT Token

**请求体**：
```json
{
  "content": "转发时的评论"
}
```

**响应**（成功 - 201）：
```json
{
  "id": 2,
  "user_id": 1,
  "content": "转发时的评论",
  "media_type": "text",
  "repost_source_id": 1,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 4.3 图片模块 (Gallery)

#### 4.3.1 获取所有分类

**端点**：`GET /gallery/categories`

**响应**（成功 - 200）：
```json
[
  {
    "id": 1,
    "name": "进击的巨人",
    "cover_image": "/uploads/covers/xxx.jpg"
  }
]
```

#### 4.3.2 获取分类下的图片

**端点**：`GET /gallery/{category_id}`

**查询参数**：
- `page` (int, default=1)
- `page_size` (int, default=30)

**响应**（成功 - 200）：
```json
{
  "category": {
    "id": 1,
    "name": "进击的巨人",
    "cover_image": "/uploads/covers/xxx.jpg"
  },
  "total": 150,
  "items": []
}
```

---

### 4.4 AI 助手模块 (AI Chat)

#### 4.4.1 发送消息

**端点**：`POST /ai/chat`

**认证**：需要 JWT Token

**请求体**：
```json
{
  "message": "你好，请介绍一下这个社区"
}
```

**响应**（成功 - 200）：
```json
{
  "user_message": {
    "id": 1,
    "role": "user",
    "content": "你好，请介绍一下这个社区",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "assistant_message": {
    "id": 2,
    "role": "assistant",
    "content": "你好！这是 Project Neon 社区...",
    "created_at": "2024-01-01T00:00:01Z"
  }
}
```

**AI System Prompt 示例**：
```
你是 Project Neon 社区的 AI 助手，名叫 Neon。
你的性格：赛博朋克风格，略带毒舌但不失温柔。
你的职责：
1. 帮助用户了解社区功能
2. 推荐优质内容
3. 解答用户疑问
4. 维护社区氛围
```

---

### 4.5 系统配置模块 (System)

#### 4.5.1 获取网站配置

**端点**：`GET /system/config`

**响应**（成功 - 200）：
```json
{
  "site_name": "Project Neon",
  "site_description": "ACG 爱好者的赛博空间",
  "intro": "欢迎来到 Project Neon！",
  "links": [
    {
      "name": "GitHub",
      "url": "https://github.com/xxx",
      "icon": "github"
    }
  ]
}
```

---

## 5. 核心模块实现指南

### 5.1 认证模块实现

#### 5.1.1 密码加密（core/security.py）

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

#### 5.1.2 JWT Token 生成（core/security.py）

```python
from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=30)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
```

#### 5.1.3 获取当前用户（dependencies.py）

```python
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="无效的认证凭据")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user
```

---

### 5.2 文件上传实现

#### 5.2.1 文件验证（utils/file_handler.py）

```python
from fastapi import UploadFile, HTTPException

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_image(file: UploadFile):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "不支持的图片格式")
```

#### 5.2.2 文件保存（utils/file_handler.py）

```python
import aiofiles
from pathlib import Path
import uuid

async def save_file(file: UploadFile, subdir: str) -> str:
    ext = Path(file.filename).suffix
    filename = f"{uuid.uuid4()}{ext}"
    filepath = Path("uploads") / subdir / filename

    filepath.parent.mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)

    return f"/uploads/{subdir}/{filename}"
```

---

### 5.3 AI 集成实现

#### 5.3.1 OpenAI 客户端（services/ai_service.py）

```python
from openai import AsyncOpenAI

class AIService:
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def chat(self, messages: list) -> str:
        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        return response.choices[0].message.content
```

#### 5.3.2 对话记忆管理（services/ai_service.py）

```python
from sqlmodel import select

def get_chat_history(session: Session, user_id: int, limit: int = 10):
    statement = (
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    messages = session.exec(statement).all()
    return list(reversed(messages))

def build_messages(history: list, new_message: str) -> list:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": new_message})
    return messages
```

---

## 6. 安全性设计

### 6.1 密码安全
- 使用 bcrypt 算法加密密码
- 密码最小长度 8 位
- 存储密码哈希，永不存储明文

### 6.2 JWT 安全
- Token 有效期 30 分钟
- 使用强随机密钥（至少 32 字节）
- 生产环境使用环境变量存储密钥

### 6.3 文件上传安全
- 验证文件类型（MIME type）
- 限制文件大小
- 使用 UUID 重命名文件，防止路径遍历
- 不执行上传的文件

### 6.4 SQL 注入防护
- SQLModel 自动参数化查询
- 避免使用原始 SQL 语句

### 6.5 CORS 配置
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 7. 性能优化方案

### 7.1 数据库优化

#### 7.1.1 索引策略
```python
class Post(SQLModel, table=True):
    user_id: int = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    category_id: int = Field(foreign_key="categories.id", index=True)
```

### 7.2 异步处理
- 所有 I/O 操作使用 async/await
- 文件操作使用 aiofiles
- 数据库操作使用异步 Session

---

## 8. 部署指南

### 8.1 开发环境启动

```bash
# 1. 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. 安装依赖
pip3 install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env

# 4. 创建上传目录
mkdir -p uploads/images uploads/videos

# 5. 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 8.2 生产环境部署

```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### 8.3 Docker 部署

**Dockerfile**：
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p uploads/images uploads/videos

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 9. 开发步骤清单

### 第一天：基础架构
- [ ] 创建项目目录结构
- [ ] 配置 config.py 和 .env
- [ ] 实现 database.py（数据库连接）
- [ ] 创建 User 和 Category 模型
- [ ] 实现 JWT 认证系统

### 第二天：认证和用户
- [ ] 实现用户注册 API
- [ ] 实现用户登录 API
- [ ] 实现获取当前用户信息 API
- [ ] 测试认证流程

### 第三天：社区动态（基础）
- [ ] 创建 Post 模型
- [ ] 实现发布动态 API（纯文本）
- [ ] 实现获取动态列表 API
- [ ] 实现分页功能

### 第四天：社区动态（扩展）
- [ ] 实现文件上传功能
- [ ] 实现点赞/收藏功能
- [ ] 实现评论功能
- [ ] 实现转发功能

### 第五天：图片模块和 AI
- [ ] 实现图片模块 API
- [ ] 集成 OpenAI API
- [ ] 实现 AI 对话功能
- [ ] 实现对话记忆

### 第六天：系统配置和优化
- [ ] 实现系统配置 API
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] API 文档完善

---

## 10. 依赖包清单

**requirements.txt**：
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
sqlmodel==0.0.14
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
openai==1.3.5
aiofiles==23.2.1
Pillow==10.1.0
pydantic==2.5.0
pydantic-settings==2.1.0
python-dotenv==1.0.0
```

---

---

## 11. 邮件服务配置

### 11.1 SMTP 配置

在 `.env` 文件中添加以下配置：

```bash
# 邮件服务配置
SMTP_HOST=smtp.qq.com          # SMTP 服务器
SMTP_PORT=587                   # SMTP 端口
SMTP_USER=your_email@qq.com     # 发件邮箱
SMTP_PASSWORD=your_auth_code    # 授权码（不是登录密码）
FROM_EMAIL=your_email@qq.com    # 发件人地址

# 前端 URL (用于生成验证链接)
FRONTEND_URL=http://localhost:5173
```

### 11.2 常用邮箱配置

| 邮箱 | SMTP 服务器 | 端口 |
|------|-------------|------|
| QQ 邮箱 | smtp.qq.com | 587 |
| 163 邮箱 | smtp.163.com | 465 |
| Gmail | smtp.gmail.com | 587 |

### 11.3 邮件功能

配置 SMTP 后支持以下功能：
- 用户注册后发送验证邮件
- 忘记密码发送重置邮件
- 验证码有效期：邮箱验证 24 小时，密码重置 1 小时

### 11.4 前端需要实现的页面

邮件中的链接会跳转到前端页面，前端必须实现以下路由：

| 路由 | 说明 | 链接格式 |
|------|------|----------|
| `/verify-email` | 邮箱验证页面 | `/verify-email?code=xxx` |
| `/reset-password` | 重置密码页面 | `/reset-password?code=xxx` |

**重置密码页面示例**：
```tsx
// pages/ResetPassword.tsx
function ResetPassword() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    const res = await fetch('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, new_password: password })
    });
    if (res.ok) {
      toast.success('密码重置成功');
      navigate('/login');
    }
  };
}
```

**邮箱验证页面示例**：
```tsx
// pages/VerifyEmail.tsx
function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    if (code) {
      fetch('/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      }).then(res => {
        if (res.ok) toast.success('邮箱验证成功');
      });
    }
  }, [code]);
}
```

---

## 12. 更新日志

### V2.4.1 (2025-12-13)
- ✅ 修复收藏功能 `is_collected` 状态不正确的问题
- ✅ 添加可选认证依赖 `get_current_user_optional`
- ✅ 配置 SMTP 邮件服务（QQ 邮箱）
- ✅ 邮箱验证和密码重置功能已可用
- ⚠️ 前端需要实现 `/reset-password` 和 `/verify-email` 页面

### V2.4 (2025-12-13)
- ✅ 用户封禁功能（is_banned、ban_reason、banned_until）
- ✅ 操作日志（AdminLog 模型）
- ✅ AI 提示词可配置（ai_system_prompt）

### V2.3 (2025-12-13)
- ✅ `media_urls` 返回格式改为数组
- ✅ API 限流保护（slowapi）
- ✅ 图片自动压缩

### V2.2 (2025-12-13)
- ✅ 管理后台仪表盘和报表

### V2.1 (2025-12-12)
- ✅ 双 Token 认证机制
- ✅ 邮箱验证功能
- ✅ 用户关注系统

### V2.0 (2025-12-12)
- ✅ 初始版本发布

---

## 总结

本文档提供了 Project Neon V2.4.1 后端的完整开发指南，包括：
- 清晰的项目结构
- 完整的数据库模型设计
- RESTful API 接口规范
- 核心功能实现示例
- 邮件服务配置
- 部署和开发流程

建议按照开发步骤指南逐步实现，预计 6 天可完成初版开发。
