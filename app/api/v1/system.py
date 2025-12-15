from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.database import get_session
from app.services.config_service import get_public_configs

router = APIRouter()


def get_config_value(configs: dict, *keys, default=""):
    """从多个可能的 key 中获取配置值，返回第一个非空值"""
    for key in keys:
        value = configs.get(key)
        if value:
            return value
    return default


@router.get("/config")
def get_system_config(session: Session = Depends(get_session)):
    """
    获取前端需要的网站配置
    
    返回格式按照前端规划文档设计，支持中英双语
    兼容多种配置项命名（site_xxx, xxx 等）
    """
    configs = get_public_configs(session)
    
    # 构建社交链接数组
    social_links = []
    if configs.get("social_instagram"):
        social_links.append({"name": "Instagram", "url": configs["social_instagram"], "icon": "instagram"})
    if configs.get("social_netease"):
        social_links.append({"name": "网易云音乐", "url": configs["social_netease"], "icon": "netease"})
    if configs.get("social_twitter"):
        social_links.append({"name": "Twitter", "url": configs["social_twitter"], "icon": "twitter"})
    if configs.get("social_discord"):
        social_links.append({"name": "Discord", "url": configs["social_discord"], "icon": "discord"})
    if configs.get("social_bilibili"):
        social_links.append({"name": "哔哩哔哩", "url": configs["social_bilibili"], "icon": "bilibili"})
    custom_links = configs.get("social_custom", [])
    if isinstance(custom_links, list):
        social_links.extend(custom_links)
    
    return {
        "site_name": get_config_value(configs, "site_name", default="LETAVERSE"),
        "site_name_cn": get_config_value(configs, "site_name_cn", default="莱塔宇宙"),
        "community_name": get_config_value(configs, "community_name", default="Lightning Community"),
        "community_name_cn": get_config_value(configs, "community_name_cn", default="闪电社区"),
        "slogan": get_config_value(configs, "slogan"),
        "slogan_cn": get_config_value(configs, "slogan_cn"),

        "logo": get_config_value(configs, "site_logo", "logo"),
        "favicon": get_config_value(configs, "site_favicon", "favicon"),
        "background": get_config_value(configs, "site_background", "background"),
        "hero_background": get_config_value(configs, "site_hero_background", "hero_background"),
        "ai_kanban": get_config_value(configs, "site_ai_kanban", "ai_kanban"),
        "default_avatar": get_config_value(configs, "site_default_avatar", "default_avatar"),
        "intro": {
            "en": get_config_value(configs, "intro_en"),
            "zh": get_config_value(configs, "intro_zh"),
        },
        "world_background": {
            "en": get_config_value(configs, "world_background_en"),
            "zh": get_config_value(configs, "world_background_zh"),
        },
        "social_links": social_links,
        "features": {
            "ai_chat": configs.get("enable_ai_chat", True),
            "registration": configs.get("enable_registration", True),
            "email_verify": configs.get("require_email_verify", False),
        },
        "ai": {
            "name": get_config_value(configs, "ai_name", default="Mu AI"),
            "name_cn": get_config_value(configs, "ai_name_cn", default="穆爱"),
            "title": get_config_value(configs, "ai_title", default="Central Brain"),
            "title_cn": get_config_value(configs, "ai_title_cn", default="中枢脑"),
            "greeting": get_config_value(configs, "ai_greeting", default="Hello~ I'm Mu ✨"),
            "greeting_cn": get_config_value(configs, "ai_greeting_cn", "ai_welcome_message", default="你好呀～我是穆爱 ✨"),
        },
        "community": {
            "status_text": get_config_value(configs, "community_status_text", default="SYSTEM: L-CONVERTER ONLINE"),
            "version": get_config_value(configs, "community_version", default="V2.0.45 BETA"),
            "create_post_text": get_config_value(configs, "create_post_text", default="Create Post"),
            "create_post_text_cn": get_config_value(configs, "create_post_text_cn", default="上传记忆碎片"),
        },
        "site_description": get_config_value(configs, "site_description", "site_name_cn", default="莱塔宇宙") + " - ACG社区",
    }
