# Project Neon V2.1 后端 API

ACG 爱好者的赛博空间 - 社区动态、图片分享、AI 助手

## 功能特性

### 用户系统
- 用户注册（邮箱验证）
- 用户登录（JWT + Refresh Token）
- 密码重置（邮件验证）
- 头像上传
- 个人主页

### 社交功能
- 关注/取消关注
- 关注列表/粉丝列表
- 社区动态（发布、点赞、评论、转发）
- 通知系统
- 搜索功能

### 内容管理
- 图片/视频上传
- 番剧分类图库
- AI 智能助手（带对话记忆）

## 技术栈

- FastAPI 0.104+
- SQLModel (SQLite / PostgreSQL)
- JWT + Refresh Token 认证
- Alembic 数据库迁移
- OpenAI API (DeepSeek)
- Python 3.10+

## 快速开始

### 1. 安装依赖

```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip3 install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入必要配置
```

必须配置：
- `SECRET_KEY` - JWT 密钥（至少 32 字符）

可选配置：
- `OPENAI_API_KEY` - AI 助手功能
- `SMTP_*` - 邮箱验证和密码重置功能

### 3. 启动服务

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

访问 http://localhost:8000/docs 查看 API 文档

## API 端点

### 认证 `/auth`
| 方法 | 端点 | 说明 |
|------|------|------|
| POST | /register | 用户注册（发送验证邮件） |
| POST | /login | 用户登录（返回双 Token） |
| POST | /logout | 用户登出 |
| POST | /refresh | 刷新 Token |
| POST | /verify-email | 验证邮箱 |
| POST | /resend-verify | 重发验证邮件 |
| POST | /forgot-password | 忘记密码 |
| POST | /reset-password | 重置密码 |
| GET | /me | 获取当前用户信息 |
| PUT | /me | 更新用户信息 |
| POST | /me/avatar | 上传头像 |
| GET | /me/stats | 获取用户统计 |

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

### 系统 `/system`
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /config | 获取系统配置 |

## 项目结构

```
app/
├── api/v1/          # API 路由
├── models/          # 数据库模型
├── schemas/         # Pydantic 模式
├── services/        # 业务服务（邮件、验证码）
├── core/            # 核心功能（认证、安全）
├── utils/           # 工具函数
├── config.py        # 配置管理
├── database.py      # 数据库连接
├── dependencies.py  # 依赖注入
└── main.py          # 应用入口
alembic/             # 数据库迁移
uploads/             # 文件上传目录
```

## 邮件配置

如需启用邮箱验证和密码重置功能，请配置以下环境变量：

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your-smtp-password
FROM_EMAIL=noreply@example.com
FRONTEND_URL=https://your-domain.com
```

如未配置邮件服务，注册仍可正常使用，但不会发送验证邮件。

## 数据库迁移

项目使用 Alembic 管理数据库迁移：

```bash
# 生成迁移脚本
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head

# 回滚
alembic downgrade -1
```

## 部署

### Docker

```bash
docker build -t project-neon .
docker run -p 8000:8000 project-neon
```

### 生产环境

```bash
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 许可证

MIT License
