# 设计文档：后端功能完善

## 概述

本设计文档描述 Project Neon 后端的功能完善方案，包括用户认证增强、社交功能、Bug 修复和数据库优化准备。

### 设计目标

1. **安全性** - 邮箱验证、密码强度、Token 管理
2. **用户体验** - 关注系统、个人主页、头像上传
3. **可维护性** - 数据库迁移支持、代码规范化
4. **向后兼容** - 不破坏现有 API 接口

## 架构

### 整体架构变更

```
┌─────────────────────────────────────────────────────────────┐
│                    Project Neon V2.1                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    FastAPI App                          │ │
│  │                                                         │ │
│  │  /auth/*  (增强)                                        │ │
│  │    - POST /register        (邮箱验证)                   │ │
│  │    - POST /login           (返回双Token)                │ │
│  │    - POST /logout          (新增)                       │ │
│  │    - POST /refresh         (新增)                       │ │
│  │    - POST /verify-email    (新增)                       │ │
│  │    - POST /resend-verify   (新增)                       │ │
│  │    - POST /forgot-password (新增)                       │ │
│  │    - POST /reset-password  (新增)                       │ │
│  │    - POST /me/avatar       (新增)                       │ │
│  │                                                         │ │
│  │  /users/*  (新增)                                       │ │
│  │    - GET /{user_id}        (个人主页)                   │ │
│  │    - GET /{user_id}/posts  (用户动态)                   │ │
│  │    - POST /{user_id}/follow   (关注)                    │ │
│  │    - DELETE /{user_id}/follow (取消关注)                │ │
│  │    - GET /{user_id}/following (关注列表)                │ │
│  │    - GET /{user_id}/followers (粉丝列表)                │ │
│  │                                                         │ │
│  │  /posts/*   (现有)                                      │ │
│  │  /gallery/* (修复分页)                                  │ │
│  │  /ai/*      (现有)                                      │ │
│  │  /system/*  (现有)                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    外部服务                              │ │
│  │  ┌──────────────┐  ┌──────────────┐                    │ │
│  │  │  邮件服务     │  │  DeepSeek AI │                    │ │
│  │  │  (SMTP)      │  │              │                    │ │
│  │  └──────────────┘  └──────────────┘                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    数据库 (SQLite → PostgreSQL)         │ │
│  │  users (增强) | follows (新增) | refresh_tokens (新增)  │ │
│  │  verification_codes (新增) | posts | categories | ...   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 组件和接口

### 1. 用户模型增强

```python
# app/models/user.py (修改)
class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    avatar: Optional[str] = None
    is_verified: bool = Field(default=False)  # 新增：邮箱是否验证
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### 2. 验证码模型 (新增)

```python
# app/models/verification.py
class VerificationType(str, Enum):
    EMAIL_VERIFY = "email_verify"
    PASSWORD_RESET = "password_reset"

class VerificationCode(SQLModel, table=True):
    __tablename__ = "verification_codes"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    code: str = Field(index=True)  # UUID 或随机字符串
    type: VerificationType
    expires_at: datetime
    used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### 3. Refresh Token 模型 (新增)

```python
# app/models/refresh_token.py
class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    token: str = Field(unique=True, index=True)
    expires_at: datetime
    revoked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### 4. 关注关系模型 (新增)

```python
# app/models/follow.py
class Follow(SQLModel, table=True):
    __tablename__ = "follows"

    id: Optional[int] = Field(default=None, primary_key=True)
    follower_id: int = Field(foreign_key="users.id", index=True)  # 关注者
    following_id: int = Field(foreign_key="users.id", index=True)  # 被关注者
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # 唯一约束：一个用户只能关注另一个用户一次
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id"),
    )
```

### 5. 邮件服务

```python
# app/services/email_service.py
class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL

    async def send_verification_email(self, to_email: str, code: str):
        """发送邮箱验证邮件"""
        verify_url = f"{settings.FRONTEND_URL}/verify-email?code={code}"
        # 发送邮件逻辑

    async def send_password_reset_email(self, to_email: str, code: str):
        """发送密码重置邮件"""
        reset_url = f"{settings.FRONTEND_URL}/reset-password?code={code}"
        # 发送邮件逻辑
```

### 6. 密码验证器

```python
# app/utils/validators.py
import re

def validate_password(password: str) -> tuple[bool, str]:
    """
    验证密码强度
    返回: (是否有效, 错误消息)
    """
    if len(password) < 8:
        return False, "密码长度至少8个字符"
    
    if not re.search(r'[a-zA-Z]', password):
        return False, "密码必须包含字母"
    
    if not re.search(r'\d', password):
        return False, "密码必须包含数字"
    
    return True, ""
```

### 7. Token 管理

```python
# app/core/security.py (增强)

def create_tokens(user_id: int) -> dict:
    """创建 Access Token 和 Refresh Token"""
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

def create_refresh_token(user_id: int) -> str:
    """创建 Refresh Token (7天有效)"""
    expire = datetime.utcnow() + timedelta(days=7)
    token = secrets.token_urlsafe(32)
    # 存储到数据库
    return token

def verify_refresh_token(token: str, session: Session) -> Optional[int]:
    """验证 Refresh Token，返回 user_id"""
    db_token = session.exec(
        select(RefreshToken).where(
            RefreshToken.token == token,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.utcnow()
        )
    ).first()
    
    if not db_token:
        return None
    
    return db_token.user_id
```

## 数据模型

### 新增表结构

#### verification_codes 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | ID |
| user_id | INTEGER | FK, NOT NULL | 用户 ID |
| code | VARCHAR(64) | NOT NULL, INDEX | 验证码 |
| type | ENUM | NOT NULL | 类型 (email_verify/password_reset) |
| expires_at | DATETIME | NOT NULL | 过期时间 |
| used | BOOLEAN | NOT NULL | 是否已使用 |
| created_at | DATETIME | NOT NULL | 创建时间 |

#### refresh_tokens 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | ID |
| user_id | INTEGER | FK, NOT NULL | 用户 ID |
| token | VARCHAR(64) | UNIQUE, NOT NULL | Token 值 |
| expires_at | DATETIME | NOT NULL | 过期时间 |
| revoked | BOOLEAN | NOT NULL | 是否已撤销 |
| created_at | DATETIME | NOT NULL | 创建时间 |

#### follows 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | ID |
| follower_id | INTEGER | FK, NOT NULL | 关注者 ID |
| following_id | INTEGER | FK, NOT NULL | 被关注者 ID |
| created_at | DATETIME | NOT NULL | 关注时间 |

**唯一约束**: UNIQUE(follower_id, following_id)

### 修改表结构

#### users 表 (增加字段)

| 新增字段 | 类型 | 约束 | 说明 |
|----------|------|------|------|
| is_verified | BOOLEAN | NOT NULL, DEFAULT FALSE | 邮箱是否验证 |

## 正确性属性

*属性是系统在所有有效执行中应保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1：密码强度验证
*对于任意*密码字符串，如果长度小于8或不包含字母或不包含数字，验证函数应返回失败
**验证: 需求 3.1, 3.2**

### 属性 2：验证码唯一性
*对于任意*新生成的验证码，数据库中不应存在相同的未使用验证码
**验证: 需求 1.1, 2.1**

### 属性 3：验证码过期检查
*对于任意*验证码，如果当前时间超过 expires_at，验证应失败
**验证: 需求 1.3, 2.3**

### 属性 4：邮箱验证状态更新
*对于任意*有效的邮箱验证码，验证成功后用户的 is_verified 应为 True
**验证: 需求 1.2**

### 属性 5：密码重置后 Token 失效
*对于任意*用户，密码重置成功后，该用户的所有 Refresh Token 应被标记为 revoked
**验证: 需求 2.5**

### 属性 6：登录返回双 Token
*对于任意*成功的登录请求，响应应同时包含 access_token 和 refresh_token
**验证: 需求 4.1**

### 属性 7：Refresh Token 轮换
*对于任意* Refresh Token 刷新操作，旧 Token 应被撤销，新 Token 应被创建
**验证: 需求 4.3**

### 属性 8：登出 Token 失效
*对于任意*登出操作，当前使用的 Refresh Token 应被标记为 revoked
**验证: 需求 4.5**

### 属性 9：关注关系创建
*对于任意*关注操作，follows 表中应存在对应的 (follower_id, following_id) 记录
**验证: 需求 5.1**

### 属性 10：取消关注删除关系
*对于任意*取消关注操作，follows 表中不应存在对应的 (follower_id, following_id) 记录
**验证: 需求 5.2**

### 属性 11：关注计数准确性
*对于任意*用户，显示的关注数应等于 follows 表中 follower_id 等于该用户 ID 的记录数
**验证: 需求 5.3**

### 属性 12：禁止自关注
*对于任意*关注请求，如果 follower_id 等于 following_id，操作应被拒绝
**验证: 需求 5.6**

### 属性 13：头像文件类型验证
*对于任意*头像上传，如果文件类型不是 JPEG、PNG 或 WebP，上传应被拒绝
**验证: 需求 6.1**

### 属性 14：头像文件大小验证
*对于任意*头像上传，如果文件大小超过 2MB，上传应被拒绝
**验证: 需求 6.2**

### 属性 15：Gallery 分页总数准确
*对于任意*图库分类查询，返回的 total 应等于该分类下图片类型动态的实际数量
**验证: 需求 7.1**

### 属性 16：个人主页字段完整
*对于任意*用户主页请求，响应应包含 username、avatar、post_count、following_count、follower_count
**验证: 需求 8.1**

## 错误处理

### 认证错误码

| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| invalid_credentials | 401 | 用户名或密码错误 |
| email_not_verified | 403 | 邮箱未验证 |
| token_expired | 401 | Token 已过期 |
| token_revoked | 401 | Token 已被撤销 |
| verification_code_expired | 400 | 验证码已过期 |
| verification_code_used | 400 | 验证码已使用 |
| password_too_weak | 400 | 密码强度不足 |

### 关注系统错误码

| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| cannot_follow_self | 400 | 不能关注自己 |
| already_following | 400 | 已经关注 |
| not_following | 400 | 未关注 |
| user_not_found | 404 | 用户不存在 |

## 测试策略

### 单元测试
- 密码验证函数测试
- Token 生成和验证测试
- 验证码生成和过期测试

### 属性测试
使用 **Hypothesis** 库：
- 密码强度验证的边界测试
- Token 轮换的正确性测试
- 关注计数的准确性测试

### 集成测试
- 完整的注册-验证-登录流程
- 密码重置流程
- 关注/取消关注流程

### 测试配置
```python
# 属性测试配置
from hypothesis import settings, given, strategies as st

@settings(max_examples=100)
@given(password=st.text(min_size=0, max_size=20))
def test_password_validation(password):
    # 测试密码验证逻辑
    pass
```

## 配置变更

### 新增环境变量

```env
# 邮件服务配置
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your-smtp-password
FROM_EMAIL=noreply@example.com

# 前端 URL (用于生成验证链接)
FRONTEND_URL=https://your-domain.com

# Token 配置
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```
