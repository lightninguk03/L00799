"""
网站配置服务
"""
import json
from typing import Any, Dict, Optional
from datetime import datetime
from sqlmodel import Session, select
from app.models.site_config import SiteConfig


def get_config(session: Session, key: str) -> Optional[str]:
    """获取单个配置值"""
    config = session.exec(
        select(SiteConfig).where(SiteConfig.key == key)
    ).first()
    return config.value if config else None


def get_config_json(session: Session, key: str) -> Any:
    """获取配置值并解析 JSON"""
    value = get_config(session, key)
    if value:
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    return None


def set_config(session: Session, key: str, value: Any, category: str = "general", description: str = "") -> SiteConfig:
    """设置配置值"""
    # 如果是复杂类型，转为 JSON
    if isinstance(value, (dict, list)):
        value = json.dumps(value, ensure_ascii=False)
    else:
        value = str(value)
    
    config = session.exec(
        select(SiteConfig).where(SiteConfig.key == key)
    ).first()
    
    if config:
        config.value = value
        config.updated_at = datetime.utcnow()
        if description:
            config.description = description
    else:
        config = SiteConfig(
            key=key,
            value=value,
            category=category,
            description=description
        )
    
    session.add(config)
    return config


def get_configs_by_category(session: Session, category: str) -> Dict[str, Any]:
    """获取某个分类下的所有配置"""
    configs = session.exec(
        select(SiteConfig).where(SiteConfig.category == category)
    ).all()
    
    result = {}
    for config in configs:
        try:
            result[config.key] = json.loads(config.value)
        except json.JSONDecodeError:
            result[config.key] = config.value
    
    return result


def get_all_configs(session: Session) -> Dict[str, Dict[str, Any]]:
    """获取所有配置，按分类组织"""
    configs = session.exec(select(SiteConfig)).all()
    
    result = {}
    for config in configs:
        if config.category not in result:
            result[config.category] = {}
        
        try:
            result[config.category][config.key] = json.loads(config.value)
        except json.JSONDecodeError:
            result[config.category][config.key] = config.value
    
    return result


def get_public_configs(session: Session) -> Dict[str, Any]:
    """获取前端需要的公开配置"""
    configs = session.exec(select(SiteConfig)).all()
    
    result = {}
    for config in configs:
        try:
            result[config.key] = json.loads(config.value)
        except json.JSONDecodeError:
            result[config.key] = config.value
    
    return result
