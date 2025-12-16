"""
Hero Banner 管理 API
"""
import json
import os
import shutil
from uuid import uuid4
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlmodel import Session
from app.database import get_session
from app.models.site_config import SiteConfig
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

BANNER_DIR = "uploads/banners"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def ensure_banner_dir():
    """确保 banner 目录存在"""
    os.makedirs(BANNER_DIR, exist_ok=True)


def get_banners_config(session: Session) -> list:
    """获取当前 banner 列表"""
    config = session.query(SiteConfig).filter(SiteConfig.key == "hero_banners").first()
    if config and config.value:
        try:
            return json.loads(config.value)
        except:
            return []
    return []


def save_banners_config(session: Session, banners: list):
    """保存 banner 列表到配置"""
    config = session.query(SiteConfig).filter(SiteConfig.key == "hero_banners").first()
    if config:
        config.value = json.dumps(banners)
    else:
        config = SiteConfig(
            key="hero_banners",
            value=json.dumps(banners),
            category="visual",
            description="首页轮播图"
        )
        session.add(config)
    session.commit()


@router.get("")
def get_banners(session: Session = Depends(get_session)):
    """获取所有 banner"""
    return {"banners": get_banners_config(session)}


@router.post("/upload")
async def upload_banner(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """上传新 banner"""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "只支持 JPG/PNG/WebP/GIF 图片")
    
    ensure_banner_dir()
    
    # 生成唯一文件名
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid4().hex}{ext}"
    filepath = os.path.join(BANNER_DIR, filename)
    
    # 保存文件
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # 更新配置
    url = f"/{BANNER_DIR}/{filename}"
    banners = get_banners_config(session)
    banners.append(url)
    save_banners_config(session, banners)
    
    return {"url": url, "banners": banners}


@router.delete("/{index}")
def delete_banner(
    index: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """删除指定位置的 banner"""
    banners = get_banners_config(session)
    
    if index < 0 or index >= len(banners):
        raise HTTPException(404, "Banner 不存在")
    
    # 删除文件
    url = banners[index]
    filepath = url.lstrip("/")
    if os.path.exists(filepath):
        os.remove(filepath)
    
    # 更新配置
    banners.pop(index)
    save_banners_config(session, banners)
    
    return {"banners": banners}


@router.put("/reorder")
def reorder_banners(
    order: list[int],
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """重新排序 banner"""
    banners = get_banners_config(session)
    
    if len(order) != len(banners):
        raise HTTPException(400, "排序数组长度不匹配")
    
    if set(order) != set(range(len(banners))):
        raise HTTPException(400, "排序数组无效")
    
    # 按新顺序重排
    new_banners = [banners[i] for i in order]
    save_banners_config(session, new_banners)
    
    return {"banners": new_banners}
