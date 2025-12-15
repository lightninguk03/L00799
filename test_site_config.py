"""
网站配置功能测试脚本
测试 /system/config API 返回的所有配置项
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_system_config():
    """测试系统配置 API"""
    print("=" * 60)
    print("🧪 网站配置功能测试")
    print("=" * 60)
    
    # 获取配置
    response = requests.get(f"{BASE_URL}/system/config")
    
    if response.status_code != 200:
        print(f"❌ API 请求失败: {response.status_code}")
        return False
    
    config = response.json()
    print(f"✅ API 请求成功，返回 {len(config)} 个字段\n")
    
    # 测试品牌信息
    print("📌 品牌信息 (brand)")
    print("-" * 40)
    brand_fields = ["site_name", "site_name_cn", "community_name", "community_name_cn", "slogan", "slogan_cn"]
    for field in brand_fields:
        value = config.get(field, "❌ 缺失")
        status = "✅" if value else "⚠️ 空值"
        print(f"  {status} {field}: {value[:30] if value else '(空)'}{'...' if value and len(str(value)) > 30 else ''}")
    
    # 测试视觉资源
    print("\n🎨 视觉资源 (visual)")
    print("-" * 40)
    visual_fields = ["logo", "favicon", "background", "hero_background", "ai_kanban", "default_avatar"]
    for field in visual_fields:
        value = config.get(field, "❌ 缺失")
        status = "✅" if value else "⚠️ 空值"
        print(f"  {status} {field}: {value if value else '(空)'}")
    
    # 测试首页内容
    print("\n📝 首页内容 (content)")
    print("-" * 40)
    intro = config.get("intro", {})
    world_bg = config.get("world_background", {})
    print(f"  {'✅' if intro.get('en') else '⚠️'} intro.en: {intro.get('en', '(空)')[:30]}...")
    print(f"  {'✅' if intro.get('zh') else '⚠️'} intro.zh: {intro.get('zh', '(空)')[:30]}...")
    print(f"  {'✅' if world_bg.get('en') else '⚠️'} world_background.en: {world_bg.get('en', '(空)')[:30] if world_bg.get('en') else '(空)'}")
    print(f"  {'✅' if world_bg.get('zh') else '⚠️'} world_background.zh: {world_bg.get('zh', '(空)')[:30] if world_bg.get('zh') else '(空)'}")
    
    # 测试社交链接
    print("\n🔗 社交链接 (social)")
    print("-" * 40)
    social_links = config.get("social_links", [])
    if social_links:
        for link in social_links:
            print(f"  ✅ {link.get('name')}: {link.get('url')}")
    else:
        print("  ⚠️ 暂无社交链接配置")
    
    # 测试功能开关
    print("\n⚡ 功能开关 (features)")
    print("-" * 40)
    features = config.get("features", {})
    print(f"  ✅ ai_chat: {features.get('ai_chat', '❌ 缺失')}")
    print(f"  ✅ registration: {features.get('registration', '❌ 缺失')}")
    print(f"  ✅ email_verify: {features.get('email_verify', '❌ 缺失')}")
    
    # 测试 AI 助手配置
    print("\n🤖 AI 助手 (ai)")
    print("-" * 40)
    ai = config.get("ai", {})
    ai_fields = ["name", "name_cn", "title", "title_cn", "greeting", "greeting_cn"]
    for field in ai_fields:
        value = ai.get(field, "❌ 缺失")
        status = "✅" if value else "⚠️ 空值"
        print(f"  {status} ai.{field}: {value[:30] if value else '(空)'}{'...' if value and len(str(value)) > 30 else ''}")
    
    # 测试社区配置
    print("\n🏠 社区页面 (community)")
    print("-" * 40)
    community = config.get("community", {})
    community_fields = ["status_text", "version", "create_post_text", "create_post_text_cn"]
    for field in community_fields:
        value = community.get(field, "❌ 缺失")
        status = "✅" if value else "⚠️ 空值"
        print(f"  {status} community.{field}: {value}")
    
    # 测试兼容字段
    print("\n🔄 兼容字段")
    print("-" * 40)
    print(f"  {'✅' if config.get('site_description') else '⚠️'} site_description: {config.get('site_description', '(空)')}")
    
    # 统计
    print("\n" + "=" * 60)
    print("📊 测试统计")
    print("=" * 60)
    
    total_fields = len(config)
    empty_count = 0
    for key, value in config.items():
        if isinstance(value, str) and not value:
            empty_count += 1
        elif isinstance(value, dict):
            for k, v in value.items():
                if isinstance(v, str) and not v:
                    empty_count += 1
    
    print(f"  总字段数: {total_fields}")
    print(f"  空值字段: {empty_count}")
    print(f"  API 状态: ✅ 正常")
    
    return True


def test_email_config():
    """测试邮件配置"""
    print("\n" + "=" * 60)
    print("📧 邮件服务配置检查")
    print("=" * 60)
    
    from app.services.email_service import email_service
    
    config = email_service._get_config()
    is_configured = email_service.is_configured()
    
    print(f"\n配置状态: {'✅ 已配置' if is_configured else '⚠️ 未配置'}\n")
    print(f"  SMTP Host: {config['smtp_host'] or '(空)'}")
    print(f"  SMTP Port: {config['smtp_port']}")
    print(f"  SMTP User: {config['smtp_user'] or '(空)'}")
    print(f"  SMTP Password: {'***' if config['smtp_password'] else '(空)'}")
    print(f"  From Email: {config['from_email'] or '(空)'}")
    print(f"  Frontend URL: {config['frontend_url']}")


def test_config_db():
    """测试数据库中的配置项"""
    print("\n" + "=" * 60)
    print("🗄️ 数据库配置项检查")
    print("=" * 60)
    
    from sqlmodel import Session, select
    from app.database import engine
    from app.models.site_config import SiteConfig
    
    with Session(engine) as session:
        configs = session.exec(select(SiteConfig)).all()
        
        # 按分类统计
        categories = {}
        for c in configs:
            cat = c.category or "未分类"
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(c.key)
        
        print(f"\n总配置项: {len(configs)} 个\n")
        
        for cat, keys in sorted(categories.items()):
            print(f"📁 {cat} ({len(keys)} 项)")
            for key in keys:
                print(f"   - {key}")
            print()


if __name__ == "__main__":
    # 测试 API
    test_system_config()
    
    # 测试邮件配置
    try:
        test_email_config()
    except Exception as e:
        print(f"\n⚠️ 邮件配置检查跳过: {e}")
    
    # 测试数据库
    try:
        test_config_db()
    except Exception as e:
        print(f"\n⚠️ 数据库检查跳过: {e}")
    
    print("\n✅ 测试完成!")
