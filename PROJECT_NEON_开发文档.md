# Project Neon 后端开发文档

## 1. 项目概述

### 1.1 项目定位
Project Neon 是一个面向 ACG 爱好者的社区平台后端，集成了：
- 社交动态分享（类似微博/Twitter）
- 图片/视频内容管理
- AI 智能助手

### 1.2 技术选型
- **FastAPI** - 现代化高性能 Web 框架
- **SQLModel** - 结合 SQLAlchemy 和 Pydantic 的 ORM
- **JWT** - 无状态认证
- **SQLAdmin** - 管理后台
- **OpenAI API** - AI 对话（兼容 DeepSeek）

---

## 2. 项目结构

```
app/
├── api/v1/           # API 路由
│   ├── auth.py       # 认证
│   ├── users.py      # 用户
│   ├── posts.py      # 动态
│   ├── gallery.py    # 图库
│   ├── ai.py         # AI 助手
│   ├── notifications.py  # 通知
│   ├── search.py     # 搜索
│   ├── banners.py    # 轮播图
│   ├── system.py     # 系统配置
│   └── admin_views.py    # 管理后台 API
├── admin/            # 管理后台
├── models/           # 数据库模型
├── schemas/          # Pydantic 模式
├── services/         # 业务服务
├── core/             # 核心功能
├── utils/            # 工具函数
├── config.py         # 配置管理
├── database.py       # 数据库连接
└── main.py           # 应用入口
```

---

## 3. 数据库模型

### User 用户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| email | VARCHAR | 邮箱，唯一 |
| username | VARCHAR | 用户名，唯一 |
| password_hash | VARCHAR | 密码哈希 |
| avatar | VARCHAR | 头像 URL |
| is_verified | BOOLEAN | 邮箱是否验证 |
| is_banned | BOOLEAN | 是否封禁 |
| ban_reason | VARCHAR | 封禁原因 |
| banned_until | DATETIME | 封禁截止时间 |

### Post 动态表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 作者 ID |
| content | TEXT | 文本内容 |
| media_type | ENUM | text/image/video |
| media_urls | JSON | 媒体 URL 列表 |
| thumbnail | VARCHAR | 视频缩略图 |
| category_id | INTEGER | 分类 ID |
| like_count | INTEGER | 点赞数 |
| comment_count | INTEGER | 评论数 |

### Interaction 互动表
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | INTEGER | 用户 ID |
| post_id | INTEGER | 动态 ID |
| type | ENUM | like/favorite |

### Follow 关注表
| 字段 | 类型 | 说明 |
|------|------|------|
| follower_id | INTEGER | 关注者 ID |
| following_id | INTEGER | 被关注者 ID |

### SiteConfig 网站配置表
| 字段 | 类型 | 说明 |
|------|------|------|
| key | VARCHAR | 配置键，唯一 |
| value | TEXT | 配置值 |
| description | VARCHAR | 配置说明 |
| category | VARCHAR | 配置分类 |

---

## 4. 环境变量

```env
# 应用
DEBUG=False

# 数据库
DATABASE_URL=sqlite:///./neon.db

# JWT
SECRET_KEY=your-secret-key-min-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30

# AI
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=deepseek-chat

# 邮件
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASSWORD=your-auth-code
FROM_EMAIL=your-email@qq.com
FRONTEND_URL=http://localhost:3000

# CORS
CORS_ORIGINS=["http://localhost:3000"]
```

---

## 5. 网站配置项

| 配置键 | 说明 |
|--------|------|
| site_name | 网站名称 |
| slogan / slogan_cn | 品牌标语 |
| logo | Logo 图片 |
| background | 全局背景图 |
| hero_background | Hero 背景 |
| hero_banners | 轮播图数组 |
| ai_kanban | AI 看板娘 |
| ai_name / ai_name_cn | AI 名称 |
| ai_greeting / ai_greeting_cn | AI 欢迎语 |
| ai_system_prompt | AI 人设提示词 |
| social_links | 社交链接数组 |
| world_database | 世界观数据 |
| announcement | 系统公告 |

---

## 6. 工具脚本

| 脚本 | 说明 |
|------|------|
| init_config.py | 初始化网站配置 |
| init_admin.py | 创建管理员账号 |
| init_data.py | 初始化测试数据 |
| convert_videos.py | 批量转码视频 |
| update_video_thumbnails.py | 更新视频缩略图 |

---

## 7. 部署

### 开发环境
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python init_config.py
python init_admin.py
uvicorn app.main:app --reload --port 8000
```

### 生产环境
```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### 数据库迁移
```bash
alembic revision --autogenerate -m "描述"
alembic upgrade head
```


