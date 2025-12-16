"""
直接修复帖子33的视频缩略图
"""
import json
from sqlmodel import Session, text
from app.database import engine

# 直接用 SQL 更新
with Session(engine) as session:
    # 先查看当前数据
    result = session.exec(text("SELECT id, media_urls FROM posts WHERE id = 33")).first()
    print(f"当前数据: {result}")
    
    # 更新为新格式
    new_data = {
        "videos": ["/uploads/videos/59bb4048-fbaf-427d-b8ca-323e798e6cd2.mp4"],
        "thumbnail": "/uploads/thumbnails/59bb4048-fbaf-427d-b8ca-323e798e6cd2_thumb.jpg"
    }
    
    session.exec(
        text("UPDATE posts SET media_urls = :data WHERE id = 33"),
        {"data": json.dumps(new_data)}
    )
    session.commit()
    
    # 验证更新
    result = session.exec(text("SELECT id, media_urls FROM posts WHERE id = 33")).first()
    print(f"更新后: {result}")
    print("✅ 完成!")
