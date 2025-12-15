# 中英文静态文案
MESSAGES = {
    "zh": {
        # 认证相关
        "email_already_exists": "邮箱已存在",
        "username_already_exists": "用户名已存在",
        "invalid_credentials": "用户名或密码错误",
        "user_not_found": "用户不存在",
        "unauthorized": "未授权，请先登录",

        # 动态相关
        "post_not_found": "动态不存在",
        "post_created": "动态发布成功",
        "post_deleted": "动态删除成功",

        # 评论相关
        "comment_created": "评论发表成功",
        "comment_not_found": "评论不存在",

        # 文件相关
        "invalid_file_type": "不支持的文件格式",
        "file_too_large": "文件大小超过限制",

        # AI 相关
        "ai_service_not_configured": "AI 服务未配置",
        "ai_service_error": "AI 服务错误",

        # 通用
        "success": "操作成功",
        "error": "操作失败",
        "category_not_found": "分类不存在",
    },
    "en": {
        # Auth
        "email_already_exists": "Email already exists",
        "username_already_exists": "Username already exists",
        "invalid_credentials": "Invalid username or password",
        "user_not_found": "User not found",
        "unauthorized": "Unauthorized, please login first",

        # Posts
        "post_not_found": "Post not found",
        "post_created": "Post created successfully",
        "post_deleted": "Post deleted successfully",

        # Comments
        "comment_created": "Comment created successfully",
        "comment_not_found": "Comment not found",

        # Files
        "invalid_file_type": "Unsupported file format",
        "file_too_large": "File size exceeds limit",

        # AI
        "ai_service_not_configured": "AI service not configured",
        "ai_service_error": "AI service error",

        # General
        "success": "Operation successful",
        "error": "Operation failed",
        "category_not_found": "Category not found",
    }
}

def get_message(code: str, lang: str = "zh") -> str:
    """获取指定语言的消息"""
    return MESSAGES.get(lang, MESSAGES["zh"]).get(code, code)
