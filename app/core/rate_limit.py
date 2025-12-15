"""
API 限流配置
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# 创建限流器实例
limiter = Limiter(key_func=get_remote_address)

# 限流规则
RATE_LIMITS = {
    "login": "5/minute",        # 登录：每分钟 5 次
    "register": "3/minute",     # 注册：每分钟 3 次
    "ai_chat": "10/minute",     # AI 聊天：每分钟 10 次
    "upload": "20/minute",      # 上传：每分钟 20 次
    "default": "60/minute",     # 默认：每分钟 60 次
}
