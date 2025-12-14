class DomainError(Exception):
    """业务错误。"""

class RateLimitExceeded(DomainError):
    """超过速率限制。"""

class InvalidInput(DomainError):
    """无效输入。"""

