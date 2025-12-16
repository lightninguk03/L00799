"""
清理网站配置脚本 V2.6.6

功能：
1. 删除前端不再使用的配置项
2. 更新保留配置项的说明
3. 添加缺失的新配置项

运行: python cleanup_config.py
"""
from sqlmodel import Session, select
from app.database import engine, create_db_and_tables
from app.models.site_config import SiteConfig

# 要删除的配置项（前端不再使用）
CONFIGS_TO_DELETE = [
    # 旧的 site_ 前缀配置项（已改用不带前缀的版本）
    "site_logo",
    "site_favicon",
    "site_background",
    "site_name_cn",
    # 旧的社区配置
    "community_name",
    "community_name_cn",
    "community_status_text",
    "community_version",
    # 旧的介绍文本
    "intro_en",
    "intro_zh",
    "world_background_en",
    "world_background_zh",
    # 旧的单独社交链接（已改用 social_links JSON数组）
    "social_instagram",
    "social_netease",
    "social_twitter",
    "social_discord",
    "social_bilibili",
    "social_custom",
    # 旧的功能开关（前端未实现）
    "enable_ai_chat",
    "enable_registration",
    "require_email_verify",
    # 旧的文本配置
    "create_post_text",
    "create_post_text_cn",
    # 旧的欢迎消息（已改用 ai_greeting）
    "ai_welcome_message",
]

# 保留的配置项及其新说明
CONFIGS_TO_UPDATE = {
    # 品牌信息
    "site_name": {"category": "brand", "description": "网站名称，显示在导航栏和浏览器标题"},
    "slogan": {"category": "brand", "description": "品牌标语(英文)，显示在首页Hero区"},
    "slogan_cn": {"category": "brand", "description": "品牌标语(中文)，显示在首页Hero区"},
    
    # AI 助手
    "ai_name": {"category": "ai", "description": "AI名称(英文)，显示在聊天窗口"},
    "ai_name_cn": {"category": "ai", "description": "AI名称(中文)，显示在聊天窗口"},
    "ai_title": {"category": "ai", "description": "AI头衔(英文)，显示在聊天窗口状态栏"},
    "ai_title_cn": {"category": "ai", "description": "AI头衔(中文)，显示在聊天窗口状态栏"},
    "ai_greeting": {"category": "ai", "description": "AI欢迎语(英文)，首次打开聊天时显示"},
    "ai_greeting_cn": {"category": "ai", "description": "AI欢迎语(中文)，首次打开聊天时显示"},
    "ai_system_prompt": {"category": "ai", "description": "AI人设提示词，定义AI性格和回复风格，修改后立即生效"},
    
    # 视觉资源
    "logo": {"category": "visual", "description": "网站Logo，显示在导航栏，建议200x200px透明PNG"},
    "favicon": {"category": "visual", "description": "浏览器标签页图标，建议32x32px"},
    "background": {"category": "visual", "description": "网站全局背景图，建议1920x1080px"},
    "hero_background": {"category": "visual", "description": "首页Hero区单张背景图，作为轮播图的fallback"},
    "hero_banners": {"category": "visual", "description": "首页轮播图数组，JSON格式如[\"url1\",\"url2\"]，优先级高于hero_background"},
    "ai_kanban": {"category": "visual", "description": "AI看板娘立绘，用于MuAI页面、首页Hero区、聊天窗口"},
    "default_avatar": {"category": "visual", "description": "默认用户头像，建议200x200px"},
    
    # 首页内容
    "world_database": {"category": "content", "description": "世界观数据库内容，JSON格式包含title/paragraphs/cards"},
    "world_database_media": {"category": "content", "description": "世界观数据库媒体，JSON数组支持图片/视频混合"},
    "social_links": {"category": "content", "description": "社交链接，JSON数组如[{\"name\":\"Instagram\",\"url\":\"...\",\"icon\":\"instagram\"}]"},
    "announcement": {"category": "content", "description": "系统公告，JSON格式{\"enabled\":true,\"type\":\"info\",\"content\":\"...\"}"},
    
    # 邮件服务
    "smtp_host": {"category": "email", "description": "SMTP服务器地址，如smtp.qq.com"},
    "smtp_port": {"category": "email", "description": "SMTP端口，通常587(TLS)或465(SSL)"},
    "smtp_user": {"category": "email", "description": "SMTP登录用户名，通常是邮箱地址"},
    "smtp_password": {"category": "email", "description": "SMTP密码或授权码（QQ邮箱需要授权码）"},
    "from_email": {"category": "email", "description": "发件人邮箱地址"},
    "frontend_url": {"category": "email", "description": "前端网站地址，用于生成邮件中的链接"},
}

# 需要新增的配置项
CONFIGS_TO_ADD = {
    "ai_name": {"value": "Mu AI", "category": "ai", "description": "AI名称(英文)，显示在聊天窗口"},
    "hero_banners": {"value": "[]", "category": "visual", "description": "首页轮播图数组，JSON格式如[\"url1\",\"url2\"]，优先级高于hero_background"},
    "world_database": {"value": '{"title":"GLOBAL DATABASE","title_cn":"世界观数据库","subtitle":"WORLD LORE","paragraphs":[],"cards":[]}', "category": "content", "description": "世界观数据库内容，JSON格式包含title/paragraphs/cards"},
    "world_database_media": {"value": "[]", "category": "content", "description": "世界观数据库媒体，JSON数组支持图片/视频混合"},
    "announcement": {"value": '{"enabled":false,"type":"info","content":"","content_cn":"","link":""}', "category": "content", "description": "系统公告，JSON格式{\"enabled\":true,\"type\":\"info\",\"content\":\"...\"}"},
    "social_links": {"value": "[]", "category": "content", "description": "社交链接，JSON数组如[{\"name\":\"Instagram\",\"url\":\"...\",\"icon\":\"instagram\"}]"},
}


def main():
    print("=" * 50)
    print("🧹 网站配置清理脚本 V2.6.6")
    print("=" * 50)
    print()
    
    create_db_and_tables()
    
    with Session(engine) as session:
        # 1. 删除不需要的配置项
        print("🗑️  步骤 1: 删除不再使用的配置项")
        deleted = 0
        for key in CONFIGS_TO_DELETE:
            config = session.exec(select(SiteConfig).where(SiteConfig.key == key)).first()
            if config:
                session.delete(config)
                print(f"  ❌ 删除: {key}")
                deleted += 1
            else:
                print(f"  ⏭️  不存在: {key}")
        print(f"  📊 删除了 {deleted} 个配置项")
        print()
        
        # 2. 更新保留配置项的说明
        print("📝 步骤 2: 更新配置项说明")
        updated = 0
        for key, info in CONFIGS_TO_UPDATE.items():
            config = session.exec(select(SiteConfig).where(SiteConfig.key == key)).first()
            if config:
                config.category = info["category"]
                config.description = info["description"]
                session.add(config)
                print(f"  ✅ 更新: {key}")
                updated += 1
            else:
                print(f"  ⚠️  不存在: {key}")
        print(f"  📊 更新了 {updated} 个配置项")
        print()
        
        # 3. 添加缺失的配置项
        print("➕ 步骤 3: 添加缺失的配置项")
        added = 0
        for key, info in CONFIGS_TO_ADD.items():
            config = session.exec(select(SiteConfig).where(SiteConfig.key == key)).first()
            if not config:
                new_config = SiteConfig(
                    key=key,
                    value=info["value"],
                    category=info["category"],
                    description=info["description"]
                )
                session.add(new_config)
                print(f"  ✅ 添加: {key}")
                added += 1
            else:
                print(f"  ⏭️  已存在: {key}")
        print(f"  📊 添加了 {added} 个配置项")
        
        session.commit()
    
    print()
    print("=" * 50)
    print("✅ 清理完成!")
    print()
    print("📋 当前保留的配置项:")
    print("   品牌: site_name, slogan, slogan_cn")
    print("   AI: ai_name, ai_name_cn, ai_title, ai_title_cn, ai_greeting, ai_greeting_cn, ai_system_prompt")
    print("   视觉: logo, favicon, background, hero_background, hero_banners, ai_kanban, default_avatar")
    print("   内容: world_database, world_database_media, social_links, announcement")
    print("   邮件: smtp_host, smtp_port, smtp_user, smtp_password, from_email, frontend_url")
    print("=" * 50)


if __name__ == "__main__":
    main()
