"""
导入现有媒体文件到媒体库

运行: python import_media.py
"""
import os
from pathlib import Path
from datetime import datetime
from sqlmodel import Session
from app.database import engine, create_db_and_tables
from app.models.media import Media

# 支持的文件类型
FILE_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
}


def import_media():
    """扫描 uploads 目录并导入媒体文件"""
    create_db_and_tables()
    
    uploads_dir = Path("uploads")
    if not uploads_dir.exists():
        print("❌ uploads 目录不存在")
        return
    
    imported = 0
    skipped = 0
    
    with Session(engine) as session:
        # 获取已存在的文件路径
        existing = set()
        for media in session.query(Media).all():
            existing.add(media.file_path)
        
        # 扫描所有子目录
        for subdir in ["images", "videos", "avatars"]:
            dir_path = uploads_dir / subdir
            if not dir_path.exists():
                continue
            
            for file in dir_path.iterdir():
                if not file.is_file():
                    continue
                
                ext = file.suffix.lower()
                if ext not in FILE_TYPES:
                    continue
                
                file_path = f"/uploads/{subdir}/{file.name}"
                
                # 跳过已存在的
                if file_path in existing:
                    skipped += 1
                    continue
                
                # 获取文件信息
                file_size = file.stat().st_size
                file_type = FILE_TYPES.get(ext, "application/octet-stream")
                
                # 获取图片尺寸
                width, height = None, None
                if ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
                    try:
                        from PIL import Image
                        with Image.open(file) as img:
                            width, height = img.size
                    except:
                        pass
                
                # 创建媒体记录
                media = Media(
                    filename=file.name,
                    original_name=file.name,
                    file_path=file_path,
                    file_type=file_type,
                    file_size=file_size,
                    width=width,
                    height=height,
                    uploaded_by=None
                )
                session.add(media)
                imported += 1
                print(f"  ✅ 导入: {file_path}")
        
        session.commit()
    
    print(f"\n📊 统计: 导入 {imported} 个, 跳过 {skipped} 个已存在")


def main():
    print("=" * 50)
    print("🖼️  导入现有媒体文件到媒体库")
    print("=" * 50)
    print()
    
    import_media()
    
    print()
    print("=" * 50)
    print("✅ 完成！可在管理后台媒体库查看")
    print("=" * 50)


if __name__ == "__main__":
    main()
