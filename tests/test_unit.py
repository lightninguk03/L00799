"""
Project Neon 单元测试
使用 pytest 测试单个函数/模块

运行: pytest tests/test_unit.py -v
"""
import pytest
from datetime import datetime, timedelta, timezone


# ==================== 密码验证测试 ====================
class TestPasswordValidation:
    """测试密码强度验证"""
    
    def test_password_too_short(self):
        """密码太短"""
        from app.utils.validators import validate_password
        is_valid, error = validate_password("Ab1234")
        assert is_valid is False
        assert error == "password_too_short"
    
    def test_password_no_letter(self):
        """密码没有字母"""
        from app.utils.validators import validate_password
        is_valid, error = validate_password("12345678")
        assert is_valid is False
        assert error == "password_needs_letter"
    
    def test_password_no_number(self):
        """密码没有数字"""
        from app.utils.validators import validate_password
        is_valid, error = validate_password("abcdefgh")
        assert is_valid is False
        assert error == "password_needs_number"
    
    def test_password_valid(self):
        """有效密码"""
        from app.utils.validators import validate_password
        is_valid, error = validate_password("Test1234")
        assert is_valid is True
        assert error == ""
        
        is_valid, error = validate_password("Password123")
        assert is_valid is True
        assert error == ""


# ==================== 密码哈希测试 ====================
class TestPasswordHash:
    """测试密码哈希和验证"""
    
    def test_hash_password(self):
        """测试密码哈希"""
        from app.core.security import hash_password
        hashed = hash_password("Test1234")
        assert hashed is not None
        assert hashed != "Test1234"
        assert len(hashed) > 20
    
    def test_verify_password_correct(self):
        """验证正确密码"""
        from app.core.security import hash_password, verify_password
        password = "Test1234"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True
    
    def test_verify_password_wrong(self):
        """验证错误密码"""
        from app.core.security import hash_password, verify_password
        hashed = hash_password("Test1234")
        assert verify_password("WrongPassword", hashed) is False


# ==================== JWT Token 测试 ====================
class TestJWTToken:
    """测试 JWT Token 生成和验证"""
    
    def test_create_access_token(self):
        """测试创建访问令牌"""
        from app.core.security import create_access_token
        token = create_access_token(user_id=1)
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 50
    
    def test_decode_access_token(self):
        """测试解码访问令牌"""
        from app.core.security import create_access_token
        from jose import jwt
        from app.config import settings
        
        user_id = 123
        token = create_access_token(user_id=user_id)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        assert payload["sub"] == str(user_id)
        assert "exp" in payload


# ==================== 时间格式化测试 ====================
class TestTimeFormatting:
    """测试时间格式化（北京时间）"""
    
    def test_utc_to_beijing(self):
        """测试 UTC 转北京时间"""
        from app.admin import format_datetime_beijing, BEIJING_TZ
        
        # 创建一个模拟对象
        class MockModel:
            created_at = datetime(2025, 12, 15, 8, 0, 0, tzinfo=timezone.utc)
        
        class MockAttr:
            key = "created_at"
        
        result = format_datetime_beijing(MockModel(), MockAttr())
        # UTC 8:00 = 北京时间 16:00
        assert "16:00:00" in result
        assert "2025-12-15" in result


# ==================== 配置服务测试 ====================
class TestConfigService:
    """测试配置服务"""
    
    def test_get_config_value_helper(self):
        """测试配置值获取辅助函数"""
        from app.api.v1.system import get_config_value
        
        configs = {
            "site_name": "Test Site",
            "logo": "/uploads/logo.png",
        }
        
        # 测试获取存在的值
        assert get_config_value(configs, "site_name") == "Test Site"
        
        # 测试获取不存在的值，返回默认值
        assert get_config_value(configs, "not_exist", default="default") == "default"
        
        # 测试多个 key 回退
        assert get_config_value(configs, "site_logo", "logo") == "/uploads/logo.png"


# ==================== 文件处理测试 ====================
class TestFileHandler:
    """测试文件处理"""
    
    def test_allowed_image_types(self):
        """测试允许的图片类型"""
        from app.utils.file_handler import ALLOWED_IMAGE_TYPES
        
        assert "image/jpeg" in ALLOWED_IMAGE_TYPES
        assert "image/png" in ALLOWED_IMAGE_TYPES
        assert "image/gif" in ALLOWED_IMAGE_TYPES
        assert "image/webp" in ALLOWED_IMAGE_TYPES
        assert "application/pdf" not in ALLOWED_IMAGE_TYPES
    
    def test_allowed_video_types(self):
        """测试允许的视频类型"""
        from app.utils.file_handler import ALLOWED_VIDEO_TYPES
        
        assert "video/mp4" in ALLOWED_VIDEO_TYPES
        assert "video/webm" in ALLOWED_VIDEO_TYPES


# ==================== 模型枚举测试 ====================
class TestModelEnums:
    """测试模型枚举值"""
    
    def test_media_type_enum(self):
        """测试媒体类型枚举"""
        from app.models.post import MediaType
        
        assert MediaType.TEXT.value == "text"
        assert MediaType.IMAGE.value == "image"
        assert MediaType.VIDEO.value == "video"
    
    def test_interaction_type_enum(self):
        """测试互动类型枚举"""
        from app.models.interaction import InteractionType
        
        assert InteractionType.LIKE.value == "like"
        assert InteractionType.FAVORITE.value == "favorite"
    
    def test_notification_type_enum(self):
        """测试通知类型枚举"""
        from app.models.notification import NotificationType
        
        assert NotificationType.LIKE.value == "like"
        assert NotificationType.COMMENT.value == "comment"
        assert NotificationType.FOLLOW.value == "follow"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
