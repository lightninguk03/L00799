from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Project Neon API"
    VERSION: str = "2.1.0"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///./neon.db"

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    
    # Mu AI 配置
    AI_TEMPERATURE: float = 0.7      # 回复创造性 (0.0-1.0)
    AI_MAX_TOKENS: int = 500         # 最大回复长度
    AI_HISTORY_LIMIT: int = 10       # 对话历史记录条数

    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024
    MAX_AVATAR_SIZE: int = 2 * 1024 * 1024  # 2MB

    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]

    # 邮件服务配置
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = ""
    
    # 前端 URL (用于生成验证链接)
    FRONTEND_URL: str = "http://localhost:3000"
    
    # 验证码过期时间
    EMAIL_VERIFY_EXPIRE_HOURS: int = 24
    PASSWORD_RESET_EXPIRE_HOURS: int = 1

    class Config:
        env_file = ".env"

settings = Settings()
