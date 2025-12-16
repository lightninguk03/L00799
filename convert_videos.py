"""
转码现有视频为 H.264 格式，并生成缩略图

运行: python convert_videos.py
"""
import subprocess
import shutil
from pathlib import Path

def is_ffmpeg_available():
    return shutil.which("ffmpeg") is not None

def get_video_codec(file_path):
    """获取视频编码"""
    try:
        cmd = [
            "ffprobe",
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=codec_name",
            "-of", "csv=p=0",
            str(file_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.stdout.strip()
    except Exception as e:
        print(f"  获取编码失败: {e}")
        return None

def convert_to_h264(input_path, output_path):
    """转换为 H.264"""
    try:
        cmd = [
            "ffmpeg",
            "-i", str(input_path),
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            "-y",
            str(output_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        return result.returncode == 0
    except Exception as e:
        print(f"  转码失败: {e}")
        return False

def generate_thumbnail(video_path, thumbnail_path):
    """生成视频缩略图"""
    try:
        cmd = [
            "ffmpeg",
            "-i", str(video_path),
            "-ss", "00:00:01",
            "-vframes", "1",
            "-vf", "scale=480:-1",
            "-q:v", "2",
            "-y",
            str(thumbnail_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            # 尝试从第0秒截取
            cmd[4] = "00:00:00"
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.returncode == 0
    except Exception as e:
        print(f"  生成缩略图失败: {e}")
        return False

def main():
    print("=" * 50)
    print("🎬 检查并转码现有视频 + 生成缩略图")
    print("=" * 50)
    print()
    
    if not is_ffmpeg_available():
        print("❌ ffmpeg 未安装")
        return
    
    videos_dir = Path("uploads/videos")
    thumbnails_dir = Path("uploads/thumbnails")
    
    if not videos_dir.exists():
        print("❌ 视频目录不存在")
        return
    
    thumbnails_dir.mkdir(parents=True, exist_ok=True)
    
    videos = list(videos_dir.glob("*.mp4"))
    print(f"找到 {len(videos)} 个视频文件")
    print()
    
    for video in videos:
        # 跳过备份文件
        if ".original" in video.name or ".h264" in video.name:
            continue
            
        print(f"📹 {video.name}")
        
        # 检查编码
        codec = get_video_codec(video)
        print(f"   编码: {codec}")
        
        if codec and codec.lower() in ["h264", "avc", "avc1"]:
            print("   ✅ 已是 H.264")
        else:
            print("   🔄 需要转码...")
            temp_output = video.with_suffix(".h264.mp4")
            
            if convert_to_h264(video, temp_output):
                backup = video.with_suffix(".original.mp4")
                video.rename(backup)
                temp_output.rename(video)
                print(f"   ✅ 转码成功")
            else:
                print("   ❌ 转码失败")
                if temp_output.exists():
                    temp_output.unlink()
        
        # 生成缩略图
        thumbnail_name = f"{video.stem}_thumb.jpg"
        thumbnail_path = thumbnails_dir / thumbnail_name
        
        if thumbnail_path.exists():
            print(f"   📷 缩略图已存在")
        else:
            if generate_thumbnail(video, thumbnail_path):
                print(f"   📷 缩略图生成成功: {thumbnail_name}")
            else:
                print(f"   ❌ 缩略图生成失败")
        
        print()
    
    print("=" * 50)
    print("✅ 完成!")
    print()
    print("注意: 现有动态的缩略图需要手动更新数据库")
    print("新上传的视频会自动生成缩略图")
    print("=" * 50)

if __name__ == "__main__":
    main()
