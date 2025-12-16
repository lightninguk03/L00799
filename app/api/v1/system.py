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
    获取前端需要的网站配置 V2.6.6
    
    精简版：只返回前端实际使用的配置项
    """
    configs = get_public_configs(session)
    
    return {
        # 品牌信息
        "site_name": get_config_value(configs, "site_name", default="LETAVERSE"),
        "slogan": get_config_value(configs, "slogan"),
        "slogan_cn": get_config_value(configs, "slogan_cn"),
        
        # 视觉资源
        "logo": get_config_value(configs, "logo"),
        "favicon": get_config_value(configs, "favicon"),
        "background": get_config_value(configs, "background"),
        "hero_background": get_config_value(configs, "hero_background"),
        "hero_banners": parse_json_array(configs.get("hero_banners", "[]")),
        "ai_kanban": get_config_value(configs, "ai_kanban"),
        "default_avatar": get_config_value(configs, "default_avatar"),
        
        # AI 助手
        "ai": {
            "name": get_config_value(configs, "ai_name", default="Mu AI"),
            "name_cn": get_config_value(configs, "ai_name_cn", default="穆爱"),
            "title": get_config_value(configs, "ai_title", default="Central Brain"),
            "title_cn": get_config_value(configs, "ai_title_cn", default="中枢脑"),
            "greeting": get_config_value(configs, "ai_greeting", default="Hello~ I'm Mu ✨"),
            "greeting_cn": get_config_value(configs, "ai_greeting_cn", default="你好呀～我是穆爱 ✨"),
        },
        
        # 首页内容
        "world_database": parse_json_object(configs.get("world_database", "{}")),
        "world_database_media": parse_json_array(configs.get("world_database_media", "[]")),
        "social_links": parse_json_array(configs.get("social_links", "[]")),
        "announcement": parse_json_object(configs.get("announcement", "{}")),
    }


def parse_json_array(value):
    """解析 JSON 数组字符串，返回列表"""
    import json
    if isinstance(value, list):
        return value
    if isinstance(value, str) and value.strip():
        try:
            result = json.loads(value)
            return result if isinstance(result, list) else []
        except:
            return []
    return []


def parse_json_object(value):
    """解析 JSON 对象字符串，返回字典"""
    import json
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value.strip():
        try:
            result = json.loads(value)
            return result if isinstance(result, dict) else {}
        except:
            return {}
    return {}
