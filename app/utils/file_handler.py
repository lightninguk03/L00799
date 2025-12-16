import aiofiles
import subprocess
import shutil
from pathlib import Path
import uuid
from io import BytesIO
from fastapi import UploadFile
from PIL import Image
from app.core.exceptions import APIException

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024
MAX_VIDEO_SIZE = 100 * 1024 * 1024

# 检查 ffmpeg 是否可用
def is_ffmpeg_available() -> bool:
    """检查系统是否安装了 ffmpeg"""
    return shutil.which("ffmpeg") is not None

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


def convert_video_to_h264(input_path: str, output_path: str) -> bool:
    """
    使用 ffmpeg 将视频转换为 H.264 编码的 MP4 格式
    这是移动端兼容性最好的格式
    
    返回: True 转换成功, False 转换失败
    """
    if not is_ffmpeg_available():
        print("[Video] ffmpeg 未安装，跳过视频转码")
        return False
    
    try:
        # ffmpeg 命令：转换为 H.264 + AAC，移动端兼容
        cmd = [
            "ffmpeg",
            "-i", input_path,           # 输入文件
            "-c:v", "libx264",          # H.264 视频编码
            "-preset", "fast",          # 编码速度（fast 平衡速度和质量）
            "-crf", "23",               # 质量（18-28，越小质量越好）
            "-c:a", "aac",              # AAC 音频编码
            "-b:a", "128k",             # 音频比特率
            "-movflags", "+faststart",  # 支持流式播放（重要！）
            "-y",                       # 覆盖输出文件
            output_path
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5分钟超时
        )
        
        if result.returncode == 0:
            print(f"[Video] 转码成功: {output_path}")
            return True
        else:
            print(f"[Video] 转码失败: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("[Video] 转码超时")
        return False
    except Exception as e:
        print(f"[Video] 转码异常: {e}")
        return False


def get_video_info(file_path: str) -> dict:
    """
    获取视频信息（编码、分辨率等）
    """
    if not is_ffmpeg_available():
        return {}
    
    try:
        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_streams",
            file_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            import json
            data = json.loads(result.stdout)
            for stream in data.get("streams", []):
                if stream.get("codec_type") == "video":
                    return {
                        "codec": stream.get("codec_name"),
                        "width": stream.get("width"),
                        "height": stream.get("height")
                    }
        return {}
    except Exception as e:
        print(f"[Video] 获取视频信息失败: {e}")
        return {}


def needs_conversion(file_path: str) -> bool:
    """
    检查视频是否需要转码
    如果不是 H.264 编码，则需要转码
    """
    info = get_video_info(file_path)
    codec = info.get("codec", "").lower()
    
    # H.264 的常见名称
    h264_codecs = ["h264", "avc", "avc1"]
    
    if codec in h264_codecs:
        print(f"[Video] 视频已是 H.264 编码，无需转码")
        return False
    
    print(f"[Video] 视频编码为 {codec}，需要转码为 H.264")
    return True


def generate_video_thumbnail(video_path: str, thumbnail_path: str) -> bool:
    """
    使用 ffmpeg 从视频生成缩略图
    截取视频第1秒的帧作为封面
    
    返回: True 成功, False 失败
    """
    if not is_ffmpeg_available():
        print("[Video] ffmpeg 未安装，跳过缩略图生成")
        return False
    
    try:
        cmd = [
            "ffmpeg",
            "-i", video_path,
            "-ss", "00:00:01",       # 从第1秒截取
            "-vframes", "1",          # 只截取1帧
            "-vf", "scale=480:-1",    # 缩放到宽度480，高度自适应
            "-q:v", "2",              # 高质量
            "-y",                     # 覆盖输出
            thumbnail_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print(f"[Video] 缩略图生成成功: {thumbnail_path}")
            return True
        else:
            # 如果第1秒失败，尝试从第0秒截取
            cmd[4] = "00:00:00"
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                print(f"[Video] 缩略图生成成功(0秒): {thumbnail_path}")
                return True
            print(f"[Video] 缩略图生成失败: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"[Video] 缩略图生成异常: {e}")
        return False

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


async def save_file(file: UploadFile, subdir: str, compress: bool = True, user_id: int = None) -> str | dict:
    """
    保存文件，支持图片自动压缩和视频自动转码，并记录到媒体库
    
    返回:
    - 图片: 返回 URL 字符串
    - 视频: 返回 {"url": "视频URL", "thumbnail": "缩略图URL"} 字典
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

    final_file_url = f"/uploads/{subdir}/{filename}"
    final_file_type = file.content_type or "application/octet-stream"
    final_file_size = len(content)
    thumbnail_url = None
    
    # 视频处理：转码 + 生成缩略图
    if subdir == "videos" and file.content_type in ALLOWED_VIDEO_TYPES:
        actual_video_path = filepath
        
        # 转码检查
        if is_ffmpeg_available() and needs_conversion(str(filepath)):
            converted_filename = f"{uuid.uuid4()}.mp4"
            converted_filepath = Path("uploads") / subdir / converted_filename
            
            if convert_video_to_h264(str(filepath), str(converted_filepath)):
                try:
                    filepath.unlink()
                except:
                    pass
                
                final_file_url = f"/uploads/{subdir}/{converted_filename}"
                final_file_type = "video/mp4"
                final_file_size = converted_filepath.stat().st_size
                filename = converted_filename
                actual_video_path = converted_filepath
            else:
                print("[Video] 转码失败，使用原始文件")
        
        # 获取视频尺寸
        video_info = get_video_info(str(actual_video_path))
        width = video_info.get("width")
        height = video_info.get("height")
        
        # 生成缩略图
        if is_ffmpeg_available():
            thumbnail_filename = f"{Path(filename).stem}_thumb.jpg"
            thumbnail_dir = Path("uploads") / "thumbnails"
            thumbnail_dir.mkdir(parents=True, exist_ok=True)
            thumbnail_filepath = thumbnail_dir / thumbnail_filename
            
            if generate_video_thumbnail(str(actual_video_path), str(thumbnail_filepath)):
                thumbnail_url = f"/uploads/thumbnails/{thumbnail_filename}"
    
    # 记录到媒体库
    try:
        from sqlmodel import Session
        from app.database import engine
        from app.models.media import Media
        
        with Session(engine) as session:
            media = Media(
                filename=filename,
                original_name=original_name,
                file_path=final_file_url,
                file_type=final_file_type,
                file_size=final_file_size,
                width=width,
                height=height,
                uploaded_by=user_id
            )
            session.add(media)
            session.commit()
    except Exception as e:
        print(f"[Media] 记录媒体失败: {e}")

    # 视频返回包含缩略图的字典
    if subdir == "videos" and thumbnail_url:
        return {"url": final_file_url, "thumbnail": thumbnail_url}
    
    return final_file_url
