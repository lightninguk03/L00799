import re
from typing import Tuple


def validate_password(password: str) -> Tuple[bool, str]:
    """
    验证密码强度
    
    要求:
    - 长度至少 8 个字符
    - 必须包含字母
    - 必须包含数字
    
    返回: (是否有效, 错误消息)
    """
    if len(password) < 8:
        return False, "password_too_short"
    
    if not re.search(r'[a-zA-Z]', password):
        return False, "password_needs_letter"
    
    if not re.search(r'\d', password):
        return False, "password_needs_number"
    
    return True, ""


def validate_email(email: str) -> Tuple[bool, str]:
    """
    验证邮箱格式
    
    返回: (是否有效, 错误消息)
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, "invalid_email_format"
    return True, ""
