"""
为现有视频帖子生成缩略图
运行: python generate_video_thumbnails.py
"""
import json
from pathlib import Path
from sqlmodel import Session, select
from app.database import engine
from app.models.post import Post, MediaType
from app.utils.file_handler import generate_video_thumbnail, is_ffmpeg_available


def generate_thumbnails_for_existing_videos():
    """为所有没有缩略图的视频帖子生成缩略图"""
    
    if not is_ffmpeg_available():
        print("❌ ffmpeg 未安装，无法生成缩略图")
        print("请先安装 ffmpeg: https://ffmpeg.org/download.html")
        return
    
    print("🔍 检查现有视频帖子...")
    
    with Session(engine) as session:
        # 查找所有视频类型的帖子
        video_posts = session.exec(
            select(Post).where(Post.media_type == MediaType.VIDEO)
        ).all()
        
        print(f"📹 找到 {len(video_posts)} 个视频帖子")
        
        updated_count = 0
        for post in video_posts:
            if not post.media_urls:
                continue
            
            try:
                parsed = json.loads(post.media_urls)
                
                # 检查是否已有缩略图
                if isinstance(parsed, dict) and parsed.get("thumbnail"):
                    print(f"  ✓ 帖子 {post.id} 已有缩略图，跳过")
                    continue
                
                # 获取视频URL列表
                if isinstance(parsed, dict) and "videos" in parsed:
                    video_urls = parsed["videos"]
                elif isinstance(parsed, list):
                    video_urls = parsed
                else:
                    continue
                
                if not video_urls:
                    continue
                
                # 取第一个视频生成缩略图
                video_url = video_urls[0]
                video_path = Path(".") / video_url.lstrip("/")
                
                if not video_path.exists():
                    print(f"  ⚠ 帖子 {post.id} 视频文件不存在: {video_path}")
                    continue
                
                # 生成缩略图
                thumbnail_filename = f"{video_path.stem}_thumb.jpg"
                thumbnail_dir = Path("uploads/thumbnails")
                thumbnail_dir.mkdir(parents=True, exist_ok=True)
                thumbnail_path = thumbnail_dir / thumbnail_filename
                
                print(f"  🎬 为帖子 {post.id} 生成缩略图...")
                
                if generate_video_thumbnail(str(video_path), str(thumbnail_path)):
                    thumbnail_url = f"/uploads/thumbnails/{thumbnail_filename}"
                    
                    # 更新帖子数据
                    new_data = {
                        "videos": video_urls,
                        "thumbnail": thumbnail_url
                    }
                    post.media_urls = json.dumps(new_data)
                    session.add(post)
                    updated_count += 1
                    print(f"  ✓ 帖子 {post.id} 缩略图生成成功: {thumbnail_url}")
                else:
                    print(f"  ✗ 帖子 {post.id} 缩略图生成失败")
                    
            except json.JSONDecodeError:
                print(f"  ⚠ 帖子 {post.id} media_urls 格式错误")
                continue
        
        if updated_count > 0:
            session.commit()
            print(f"\n✅ 完成！已为 {updated_count} 个视频帖子生成缩略图")
        else:
            print("\n📝 没有需要更新的帖子")


if __name__ == "__main__":
    generate_thumbnails_for_existing_videos()
