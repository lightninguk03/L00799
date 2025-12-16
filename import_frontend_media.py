"""
从前端目录导入图片到后端媒体库

运行: python import_frontend_media.py
"""
import os
import shutil
from pathlib import Path
from datetime import datetime
from sqlmodel import Session
from app.database import engine, create_db_and_tables
from app.models.media import Media

# 前端图片映射 (源路径 -> 目标文件名)
FRONTEND_IMAGES = {
    # 前端 public 目录
    "../前端/public/favicon.jpg": "favicon.jpg",
    # 前端 assets 目录
    "../前端/src/assets/ai_avatar.png": "ai_avatar.png",
    "../前端/src/assets/bg_cyberpunk.jpg": "bg_cyberpunk.jpg",
    "../前端/src/assets/bg_hero.jpg": "bg_hero.jpg",
    "../前端/src/assets/bg_main.jpg": "bg_main.jpg",
    "../前端/src/assets/default_avatar.jpg": "default_avatar.jpg",
    "../前端/src/assets/kanban_girl.png": "kanban_girl.png",
    "../前端/src/assets/logo.jpg": "logo.jpg",
    "../前端/src/assets/mu_ai_kanban.png": "mu_ai_kanban.png",
}

FILE_TYPES = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp",
}


def import_frontend_images():
    """从前端复制图片到后端并导入媒体库"""
    create_db_and_tables()
    
    uploads_dir = Path("uploads/images")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    imported = 0
    skipped = 0
    not_found = 0
    
    with Session(engine) as session:
        # 获取已存在的文件
        existing = {m.original_name for m in session.query(Media).all()}
        
        for src_path, filename in FRONTEND_IMAGES.items():
            src = Path(src_path)
            
            if not src.exists():
                print(f"  ⚠️  未找到: {src_path}")
                not_found += 1
                continue
            
            if filename in existing:
                print(f"  ⏭️  已存在: {filename}")
                skipped += 1
                continue
            
            # 复制文件
            dest = uploads_dir / filename
            shutil.copy2(src, dest)
            
            # 获取文件信息
            ext = src.suffix.lower()
            file_size = dest.stat().st_size
            file_type = FILE_TYPES.get(ext, "image/jpeg")
            file_path = f"/uploads/images/{filename}"
            
            # 获取图片尺寸
            width, height = None, None
            try:
                from PIL import Image
                with Image.open(dest) as img:
                    width, height = img.size
            except:
                pass
            
            # 创建媒体记录
            media = Media(
                filename=filename,
                original_name=filename,
                file_path=file_path,
                file_type=file_type,
                file_size=file_size,
                width=width,
                height=height,
                uploaded_by=None
            )
            session.add(media)
            imported += 1
            print(f"  ✅ 导入: {filename}")
        
        session.commit()
    
    print(f"\n📊 统计: 导入 {imported}, 跳过 {skipped}, 未找到 {not_found}")


if __name__ == "__main__":
    print("=" * 50)
    print("🖼️  从前端导入图片到媒体库")
    print("=" * 50)
    import_frontend_images()
    print("\n✅ 完成！")
