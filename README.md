# Project Neon 后端 API

ACG 爱好者社区平台后端服务 - 社区动态、图片分享、AI 助手

## 功能特性

### 用户系统
- 用户注册（支持邮箱验证）
- 用户登录（JWT + Refresh Token 双令牌认证）
- 密码重置（邮件验证）
- 头像上传
- 个人主页
- 用户封禁管理

### 社交功能
- 关注/取消关注
- 关注列表/粉丝列表
- 社区动态（发布、编辑、删除、转发）
- 点赞、收藏、评论
- 通知系统（点赞、评论、关注、转发）
- 全站搜索（动态、用户）

### 内容管理
- 图片/视频上传（自动压缩、视频缩略图生成）
- 番剧分类图库
- 首页轮播图管理

### AI 助手
- AI 智能对话（支持 OpenAI/DeepSeek）
- 对话历史记忆
- 可配置 AI 人设

### 管理后台
- 用户管理（查看、封禁）
- 内容管理（动态、评论、分类）
- 网站配置（品牌、视觉资源、AI 设置）
- 数据统计（仪表盘、报表、CSV 导出）
- 操作日志

## 技术栈

- Python 3.10+
- FastAPI 0.104+
- SQLModel (SQLite / PostgreSQL)
- JWT + Refresh Token 认证
- Alembic 数据库迁移
- SQLAdmin 管理后台
- OpenAI API 兼容接口

## 快速开始

### 1. 安装依赖

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，必须配置：
- `SECRET_KEY` - JWT 密钥（至少 32 字符，可用 `openssl rand -hex 32` 生成）

可选配置：
- `OPENAI_API_KEY` - AI 助手功能（支持 DeepSeek）
- `SMTP_*` - 邮箱验证和密码重置功能

### 3. 初始化

```bash
# 初始化网站配置
python init_config.py

# 创建管理员账号
python init_admin.py
```

### 4. 启动服务

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

或使用启动脚本：
- Windows: 双击 `start.bat`
- Linux/Mac: `./start.sh`

### 5. 访问

- API 文档: http://localhost:8000/docs
- 管理后台: http://localhost:8000/admin
  - 默认账号: `admin`
  - 默认密码: `Admin123`

## 项目结构

```
app/
├── api/v1/           # API 路由
│   ├── auth.py       # 认证（注册、登录、密码重置）
│   ├── users.py      # 用户（主页、关注）
│   ├── posts.py      # 动态（发布、互动、评论）
│   ├── gallery.py    # 图库（分类、图片）
│   ├── ai.py         # AI 助手
│   ├── notifications.py  # 通知
│   ├── search.py     # 搜索
│   ├── banners.py    # 轮播图
│   └── system.py     # 系统配置
├── admin/            # 管理后台
├── models/           # 数据库模型
├── schemas/          # Pydantic 模式
├── services/         # 业务服务
├── core/             # 核心功能（认证、安全、限流）
├── utils/            # 工具函数
├── config.py         # 配置管理
├── database.py       # 数据库连接
└── main.py           # 应用入口
alembic/              # 数据库迁移
uploads/              # 文件上传目录
```

## API 端点

### 认证 `/auth`
| 方法 | 端点 | 说明 |
|------|------|------|
| POST | /register | 用户注册 |
| POST | /login | 用户登录 |
| POST | /logout | 用户登出 |
| POST | /refresh | 刷新 Token |
| POST | /verify-email | 验证邮箱 |
| POST | /forgot-password | 忘记密码 |
| POST | /reset-password | 重置密码 |
| GET | /me | 获取当前用户 |
| PUT | /me | 更新用户信息 |
| POST | /me/avatar | 上传头像 |

### 用户 `/users`
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /{user_id} | 获取用户主页 |
| GET | /{user_id}/posts | 获取用户动态 |
| POST | /{user_id}/follow | 关注用户 |
| DELETE | /{user_id}/follow | 取消关注 |
| GET | /{user_id}/following | 关注列表 |
| GET | /{user_id}/followers | 粉丝列表 |

### 动态 `/posts`
| 方法 | 端点 | 说明 |
|------|------|------|
| POST | / | 发布动态 |
| GET | / | 获取动态列表 |
| GET | /me | 获取我的动态 |
| GET | /{id} | 获取动态详情 |
| PUT | /{id} | 编辑动态 |
| DELETE | /{id} | 删除动态 |
| POST | /{id}/interact | 点赞/收藏 |
| POST | /{id}/comments | 发表评论 |
| GET | /{id}/comments | 获取评论 |
| POST | /{id}/repost | 转发 |

### 图库 `/gallery`
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /categories | 获取分类列表 |
| GET | /{category_id} | 获取分类图片 |

### 通知 `/notifications`
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | / | 获取通知列表 |
| POST | /{id}/read | 标记已读 |
| POST | /read-all | 全部已读 |

### 搜索 `/search`
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /posts | 搜索动态 |
| GET | /users | 搜索用户 |

### AI `/ai`
| 方法 | 端点 | 说明 |
|------|------|------|
| POST | /chat | 与 AI 对话 |

### 轮播图 `/banners`
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | / | 获取轮播图列表 |
| POST | /upload | 上传轮播图 |
| DELETE | /{index} | 删除轮播图 |
| PUT | /reorder | 重新排序 |

### 系统 `/system`
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /config | 获取网站配置 |

## 环境变量说明

```env
# 应用配置
DEBUG=False

# 数据库
DATABASE_URL=sqlite:///./neon.db

# JWT 认证
SECRET_KEY=your-secret-key-min-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30

# AI 服务（OpenAI 兼容接口）
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=deepseek-chat

# 邮件服务（可选）
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASSWORD=your-auth-code
FROM_EMAIL=your-email@qq.com
FRONTEND_URL=http://localhost:3000

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

## 数据库迁移

```bash
# 生成迁移脚本
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head

# 回滚
alembic downgrade -1
```

## 生产部署

### 使用 Gunicorn

```bash
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker

```bash
docker build -t project-neon .
docker run -p 8000:8000 project-neon
```

详细部署说明请参考 `部署指南.md`

## API 限流

| 接口 | 限制 |
|------|------|
| POST /auth/register | 3次/分钟 |
| POST /auth/login | 5次/分钟 |
| POST /auth/forgot-password | 3次/分钟 |
| POST /ai/chat | 10次/分钟 |
| POST /posts/ | 20次/分钟 |

## 许可证

MIT License
