"""
更新数据库中视频帖子的缩略图字段
"""
import json
from pathlib import Path
from sqlmodel import Session, select
from app.database import engine
from app.models.post import Post, MediaType

def update_thumbnails():
    print("🔍 更新视频帖子缩略图...")
    
    with Session(engine) as session:
        video_posts = session.exec(
            select(Post).where(Post.media_type == MediaType.VIDEO)
        ).all()
        
        print(f"📹 找到 {len(video_posts)} 个视频帖子")
        
        updated = 0
        for post in video_posts:
            if not post.media_urls:
                continue
            
            try:
                parsed = json.loads(post.media_urls)
                
                # 已经是新格式且有缩略图
                if isinstance(parsed, dict) and parsed.get("thumbnail"):
                    print(f"  ✓ 帖子 {post.id} 已有缩略图")
                    continue
                
                # 获取视频URL
                if isinstance(parsed, dict) and "videos" in parsed:
                    video_urls = parsed["videos"]
                elif isinstance(parsed, list):
                    video_urls = parsed
                else:
                    continue
                
                if not video_urls:
                    continue
                
                # 查找对应的缩略图
                video_url = video_urls[0]
                video_filename = Path(video_url).stem
                thumbnail_path = Path(f"uploads/thumbnails/{video_filename}_thumb.jpg")
                
                if thumbnail_path.exists():
                    thumbnail_url = f"/uploads/thumbnails/{video_filename}_thumb.jpg"
                    new_data = {
                        "videos": video_urls,
                        "thumbnail": thumbnail_url
                    }
                    post.media_urls = json.dumps(new_data)
                    session.add(post)
                    updated += 1
                    print(f"  ✓ 帖子 {post.id} 更新成功: {thumbnail_url}")
                else:
                    print(f"  ⚠ 帖子 {post.id} 缩略图不存在: {thumbnail_path}")
                    
            except json.JSONDecodeError:
                continue
        
        if updated > 0:
            session.commit()
            print(f"\n✅ 完成！更新了 {updated} 个帖子")
        else:
            print("\n📝 没有需要更新的帖子")

if __name__ == "__main__":
    update_thumbnails()
