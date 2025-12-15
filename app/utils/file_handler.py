import aiofiles
from pathlib import Path
import uuid
from io import BytesIO
from fastapi import UploadFile
from PIL import Image
from app.core.exceptions import APIException

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024
MAX_VIDEO_SIZE = 100 * 1024 * 1024

# 图片压缩配置
IMAGE_MAX_WIDTH = 1920  # 最大宽度
IMAGE_MAX_HEIGHT = 1920  # 最大高度
IMAGE_QUALITY = 85  # JPEG 压缩质量

async def validate_image(file: UploadFile):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise APIException(400, "invalid_file_type")

    # 检查文件大小
    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise APIException(400, "file_too_large")

    # 重置文件指针
    await file.seek(0)

async def validate_video(file: UploadFile):
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise APIException(400, "invalid_file_type")

    # 检查文件大小
    content = await file.read()
    if len(content) > MAX_VIDEO_SIZE:
        raise APIException(400, "file_too_large")

    # 重置文件指针
    await file.seek(0)

def compress_image(content: bytes, content_type: str) -> tuple[bytes, str]:
    """
    压缩图片：调整尺寸并压缩质量
    返回: (压缩后的内容, 新的扩展名)
    """
    # GIF 不压缩（保留动画）
    if content_type == "image/gif":
        return content, ".gif"
    
    try:
        img = Image.open(BytesIO(content))
        
        # 转换 RGBA 为 RGB（JPEG 不支持透明通道）
        if img.mode in ("RGBA", "P"):
            # PNG/WebP 保持原格式以支持透明
            if content_type in ("image/png", "image/webp"):
                pass
            else:
                img = img.convert("RGB")
        
        # 调整尺寸（保持比例）
        if img.width > IMAGE_MAX_WIDTH or img.height > IMAGE_MAX_HEIGHT:
            img.thumbnail((IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT), Image.Resampling.LANCZOS)
        
        # 保存压缩后的图片
        output = BytesIO()
        
        if content_type == "image/png":
            img.save(output, format="PNG", optimize=True)
            ext = ".png"
        elif content_type == "image/webp":
            img.save(output, format="WEBP", quality=IMAGE_QUALITY)
            ext = ".webp"
        else:
            # JPEG
            if img.mode != "RGB":
                img = img.convert("RGB")
            img.save(output, format="JPEG", quality=IMAGE_QUALITY, optimize=True)
            ext = ".jpg"
        
        return output.getvalue(), ext
    except Exception:
        # 压缩失败，返回原内容
        ext = ".jpg" if content_type == "image/jpeg" else Path(content_type.split("/")[1]).suffix
        return content, f".{ext}" if not ext.startswith(".") else ext


async def save_file(file: UploadFile, subdir: str, compress: bool = True, user_id: int = None) -> str:
    """
    保存文件，支持图片自动压缩，并记录到媒体库
    """
    content = await file.read()
    original_name = file.filename or "unknown"
    ext = Path(original_name).suffix if original_name else ""
    original_size = len(content)
    
    # 图片压缩
    width, height = None, None
    if compress and subdir == "images" and file.content_type in ALLOWED_IMAGE_TYPES:
        # 获取原始尺寸
        try:
            from PIL import Image
            from io import BytesIO
            img = Image.open(BytesIO(content))
            width, height = img.size
        except:
            pass
        content, ext = compress_image(content, file.content_type)
    
    filename = f"{uuid.uuid4()}{ext}"
    filepath = Path("uploads") / subdir / filename

    filepath.parent.mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    file_url = f"/uploads/{subdir}/{filename}"
    
    # 记录到媒体库
    try:
        from sqlmodel import Session
        from app.database import engine
        from app.models.media import Media
        
        with Session(engine) as session:
            media = Media(
                filename=filename,
                original_name=original_name,
                file_path=file_url,
                file_type=file.content_type or "application/octet-stream",
                file_size=len(content),
                width=width,
                height=height,
                uploaded_by=user_id
            )
            session.add(media)
            session.commit()
    except Exception as e:
        # 记录失败不影响文件上传
        print(f"[Media] 记录媒体失败: {e}")

    return file_url
