"""
使用 OpenCV 为视频生成缩略图（不需要 ffmpeg）
运行: pip install opencv-python 然后 python generate_thumbnails_opencv.py
"""
import json
from pathlib import Path

def generate_thumbnail_opencv(video_path: str, thumbnail_path: str) -> bool:
    """使用 OpenCV 从视频生成缩略图"""
    try:
        import cv2
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"  无法打开视频: {video_path}")
            return False
        
        # 获取视频总帧数和帧率
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        # 尝试跳到第1秒的位置
        target_frame = int(fps) if fps > 0 else 30
        if target_frame >= total_frames:
            target_frame = 0
        
        cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
        ret, frame = cap.read()
        
        if not ret:
            # 如果失败，尝试读取第一帧
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()
        
        cap.release()
        
        if not ret:
            print(f"  无法读取视频帧")
            return False
        
        # 调整大小（宽度480，保持比例）
        height, width = frame.shape[:2]
        new_width = 480
        new_height = int(height * new_width / width)
        frame = cv2.resize(frame, (new_width, new_height))
        
        # 保存缩略图
        cv2.imwrite(thumbnail_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return True
        
    except ImportError:
        print("❌ 请先安装 opencv-python: pip install opencv-python")
        return False
    except Exception as e:
        print(f"  生成缩略图失败: {e}")
        return False


def main():
    from sqlmodel import Session, select
    from app.database import engine
    from app.models.post import Post, MediaType
    
    print("🔍 检查现有视频帖子...")
    
    with Session(engine) as session:
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
                
                if generate_thumbnail_opencv(str(video_path), str(thumbnail_path)):
                    thumbnail_url = f"/uploads/thumbnails/{thumbnail_filename}"
                    
                    new_data = {
                        "videos": video_urls,
                        "thumbnail": thumbnail_url
                    }
                    post.media_urls = json.dumps(new_data)
                    session.add(post)
                    updated_count += 1
                    print(f"  ✓ 帖子 {post.id} 缩略图生成成功")
                else:
                    print(f"  ✗ 帖子 {post.id} 缩略图生成失败")
                    
            except json.JSONDecodeError:
                continue
        
        if updated_count > 0:
            session.commit()
            print(f"\n✅ 完成！已为 {updated_count} 个视频帖子生成缩略图")
        else:
            print("\n📝 没有需要更新的帖子")


if __name__ == "__main__":
    main()
