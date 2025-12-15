from fastapi import HTTPException

class APIException(HTTPException):
    """统一的 API 异常，返回错误码"""
    def __init__(self, status_code: int, error_code: str, detail = None):
        # 支持传入字典作为额外信息
        if isinstance(detail, dict):
            response_detail = {
                "error_code": error_code,
                "message": error_code,
                **detail
            }
        else:
            response_detail = {
                "error_code": error_code,
                "message": detail or error_code
            }
        super().__init__(
            status_code=status_code,
            detail=response_detail
        )
