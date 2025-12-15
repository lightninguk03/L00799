import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


def get_email_config_from_db():
    """从数据库获取邮件配置，优先使用数据库配置，否则使用环境变量"""
    from sqlmodel import Session
    from app.database import engine
    from app.services.config_service import get_config
    
    try:
        with Session(engine) as session:
            smtp_host = get_config(session, "smtp_host") or settings.SMTP_HOST
            smtp_port = get_config(session, "smtp_port") or str(settings.SMTP_PORT)
            smtp_user = get_config(session, "smtp_user") or settings.SMTP_USER
            smtp_password = get_config(session, "smtp_password") or settings.SMTP_PASSWORD
            from_email = get_config(session, "from_email") or settings.FROM_EMAIL
            frontend_url = get_config(session, "frontend_url") or settings.FRONTEND_URL
            
            return {
                "smtp_host": smtp_host,
                "smtp_port": int(smtp_port) if smtp_port else 587,
                "smtp_user": smtp_user,
                "smtp_password": smtp_password,
                "from_email": from_email,
                "frontend_url": frontend_url,
            }
    except Exception as e:
        print(f"[EmailService] 从数据库获取配置失败，使用环境变量: {e}")
        return {
            "smtp_host": settings.SMTP_HOST,
            "smtp_port": settings.SMTP_PORT,
            "smtp_user": settings.SMTP_USER,
            "smtp_password": settings.SMTP_PASSWORD,
            "from_email": settings.FROM_EMAIL,
            "frontend_url": settings.FRONTEND_URL,
        }


class EmailService:
    """邮件发送服务"""
    
    def _get_config(self):
        """获取最新的邮件配置（每次发送时重新获取，支持热更新）"""
        return get_email_config_from_db()
    
    def is_configured(self) -> bool:
        """检查邮件服务是否已配置"""
        config = self._get_config()
        return bool(config["smtp_host"] and config["smtp_user"] and config["smtp_password"])
    
    async def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """发送邮件"""
        config = self._get_config()
        
        if not (config["smtp_host"] and config["smtp_user"] and config["smtp_password"]):
            print(f"[EmailService] 邮件服务未配置，跳过发送: {subject} -> {to_email}")
            return False
        
        message = MIMEMultipart("alternative")
        message["From"] = config["from_email"]
        message["To"] = to_email
        message["Subject"] = subject
        
        html_part = MIMEText(html_content, "html", "utf-8")
        message.attach(html_part)
        
        try:
            await aiosmtplib.send(
                message,
                hostname=config["smtp_host"],
                port=config["smtp_port"],
                username=config["smtp_user"],
                password=config["smtp_password"],
                start_tls=True
            )
            return True
        except Exception as e:
            print(f"[EmailService] 发送邮件失败: {e}")
            return False
    
    async def send_verification_email(self, to_email: str, username: str, code: str) -> bool:
        """发送邮箱验证邮件"""
        config = self._get_config()
        verify_url = f"{config['frontend_url']}/verify-email?code={code}"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366f1;">欢迎加入 Project Neon！</h2>
            <p>你好，{username}！</p>
            <p>请点击下面的按钮验证你的邮箱地址：</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{verify_url}" 
                   style="background-color: #6366f1; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                    验证邮箱
                </a>
            </p>
            <p>或者复制以下链接到浏览器：</p>
            <p style="color: #666; word-break: break-all;">{verify_url}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                此链接 24 小时内有效。如果你没有注册 Project Neon，请忽略此邮件。
            </p>
        </body>
        </html>
        """
        
        return await self.send_email(to_email, "验证你的 Project Neon 账户", html_content)
    
    async def send_password_reset_email(self, to_email: str, username: str, code: str) -> bool:
        """发送密码重置邮件"""
        config = self._get_config()
        reset_url = f"{config['frontend_url']}/reset-password?code={code}"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366f1;">重置你的密码</h2>
            <p>你好，{username}！</p>
            <p>我们收到了重置你 Project Neon 账户密码的请求。点击下面的按钮设置新密码：</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" 
                   style="background-color: #6366f1; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                    重置密码
                </a>
            </p>
            <p>或者复制以下链接到浏览器：</p>
            <p style="color: #666; word-break: break-all;">{reset_url}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                此链接 1 小时内有效。如果你没有请求重置密码，请忽略此邮件。
            </p>
        </body>
        </html>
        """
        
        return await self.send_email(to_email, "重置你的 Project Neon 密码", html_content)


# 全局邮件服务实例
email_service = EmailService()
