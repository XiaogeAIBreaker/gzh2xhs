"""
异常处理系统

定义项目特定的异常类层次结构：
- BaseAppError: 应用异常基类
- DomainError: 领域异常
- InfrastructureError: 基础设施异常
- ValidationError: 验证异常
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional, List
import traceback


class BaseAppError(Exception):
    """应用异常基类"""
    
    def __init__(
        self,
        message: str,
        error_code: str | None = None,
        details: Dict[str, Any] | None = None,
        cause: Exception | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        self.cause = cause
        self.timestamp = datetime.utcnow()
        self.traceback_str = traceback.format_exc() if cause else None

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "error_type": self.__class__.__name__,
            "error_code": self.error_code,
            "message": self.message,
            "details": self.details,
            "timestamp": self.timestamp.isoformat(),
            "cause": str(self.cause) if self.cause else None,
            "traceback": self.traceback_str,
        }

    def __str__(self) -> str:
        return f"[{self.error_code}] {self.message}"

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"message={self.message!r}, "
            f"error_code={self.error_code!r}, "
            f"details={self.details!r}"
            f")"
        )


class DomainError(BaseAppError):
    """领域层异常"""
    pass


class ValidationError(BaseAppError):
    """验证异常"""
    pass


class ConfigurationError(BaseAppError):
    """配置异常"""
    pass


class InfrastructureError(BaseAppError):
    """基础设施异常"""
    pass


class ServiceUnavailableError(InfrastructureError):
    """服务不可用异常"""
    pass


class ConnectionError(InfrastructureError):
    """连接异常"""
    pass


class TimeoutError(InfrastructureError):
    """超时异常"""
    pass


class CacheError(InfrastructureError):
    """缓存异常"""
    pass


class DatabaseError(InfrastructureError):
    """数据库异常"""
    pass


class AIServiceError(InfrastructureError):
    """AI服务异常"""
    pass


class RenderServiceError(InfrastructureError):
    """渲染服务异常"""
    pass


class AuthenticationError(BaseAppError):
    """认证异常"""
    pass


class AuthorizationError(BaseAppError):
    """授权异常"""
    pass


class QuotaExceededError(BaseAppError):
    """配额超限异常"""
    pass


class RateLimitError(BaseAppError):
    """频率限制异常"""
    pass


class NotFoundError(BaseAppError):
    """资源未找到异常"""
    pass


class ConflictError(BaseAppError):
    """资源冲突异常"""
    pass


class BusinessRuleError(BaseAppError):
    """业务规则异常"""
    pass


# 异常处理装饰器
def handle_exceptions(
    logger: Any,
    default_error_code: str | None = None,
    re_raise: bool = True,
):
    """异常处理装饰器"""
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except BaseAppError:
                raise
            except Exception as e:
                error_code = default_error_code or func.__name__.upper()
                logger.error(
                    f"函数 {func.__name__} 执行失败",
                    extra={
                        "error_code": error_code,
                        "exception_type": type(e).__name__,
                        "exception_message": str(e),
                        "args": str(args)[:200],  # 限制长度
                        "kwargs": str(kwargs)[:200],
                    },
                    exc_info=True,
                )
                if re_raise:
                    raise InfrastructureError(
                        message=f"函数 {func.__name__} 执行失败: {e}",
                        error_code=error_code,
                        cause=e,
                    ) from e
                return None

        def sync_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except BaseAppError:
                raise
            except Exception as e:
                error_code = default_error_code or func.__name__.upper()
                logger.error(
                    f"函数 {func.__name__} 执行失败",
                    extra={
                        "error_code": error_code,
                        "exception_type": type(e).__name__,
                        "exception_message": str(e),
                        "args": str(args)[:200],
                        "kwargs": str(kwargs)[:200],
                    },
                    exc_info=True,
                )
                if re_raise:
                    raise InfrastructureError(
                        message=f"函数 {func.__name__} 执行失败: {e}",
                        error_code=error_code,
                        cause=e,
                    ) from e
                return None

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


# 异步支持检查
import asyncio


# 异常映射
class ExceptionMapper:
    """异常映射器"""

    _mappings: Dict[type[type[Exception]], type[BaseAppError]] = {
        ConnectionError: ConnectionError,
        TimeoutError: TimeoutError,
        ValueError: ValidationError,
        KeyError: NotFoundError,
        PermissionError: AuthorizationError,
    }

    @classmethod
    def map_exception(
        cls,
        exception: Exception,
        message: str | None = None,
        error_code: str | None = None,
        details: Dict[str, Any] | None = None,
    ) -> BaseAppError:
        """映射异常"""
        if isinstance(exception, BaseAppError):
            return exception

        # 查找映射
        mapped_class = cls._mappings.get(type(exception), InfrastructureError)
        
        # 构建新异常
        mapped_exception = mapped_class(
            message=message or str(exception),
            error_code=error_code,
            details=details,
            cause=exception,
        )
        
        return mapped_exception

    @classmethod
    def register_mapping(
        cls,
        original_exception_type: type[Exception],
        mapped_exception_type: type[BaseAppError],
    ) -> None:
        """注册异常映射"""
        cls._mappings[original_exception_type] = mapped_exception_type


# 全局异常处理器
class GlobalExceptionHandler:
    """全局异常处理器"""

    def __init__(self, logger: Any) -> None:
        self.logger = logger
        self.error_counts: Dict[str, int] = {}
        self.error_history: List[BaseAppError] = []

    def handle_exception(
        self,
        exception: Exception,
        context: Dict[str, Any] | None = None,
    ) -> BaseAppError:
        """处理异常"""
        # 映射异常
        if isinstance(exception, BaseAppError):
            app_error = exception
        else:
            app_error = ExceptionMapper.map_exception(
                exception,
                message=context.get("message") if context else None,
                error_code=context.get("error_code") if context else None,
            )

        # 记录错误统计
        error_type = app_error.error_code
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1
        self.error_history.append(app_error)

        # 保持历史记录长度
        if len(self.error_history) > 1000:
            self.error_history = self.error_history[-500:]

        # 记录日志
        self.logger.error(
            f"应用异常: {app_error.message}",
            extra={
                "error_code": app_error.error_code,
                "error_type": type(app_error).__name__,
                "timestamp": app_error.timestamp.isoformat(),
                "context": context or {},
                "error_count": self.error_counts[error_type],
            },
            exc_info=True,
        )

        return app_error

    def get_error_statistics(self) -> Dict[str, Any]:
        """获取错误统计"""
        return {
            "total_errors": sum(self.error_counts.values()),
            "error_types": list(self.error_counts.keys()),
            "error_counts": self.error_counts.copy(),
            "recent_errors": [
                {
                    "error_code": error.error_code,
                    "message": error.message,
                    "timestamp": error.timestamp.isoformat(),
                }
                for error in self.error_history[-10:]
            ],
        }


# 业务异常工厂
class BusinessErrorFactory:
    """业务异常工厂"""

    @staticmethod
    def card_not_found(card_id: str) -> NotFoundError:
        """创建卡片未找到异常"""
        return NotFoundError(
            message=f"卡片不存在: {card_id}",
            error_code="CARD_NOT_FOUND",
            details={"card_id": card_id},
        )

    @staticmethod
    def template_not_found(template_id: str) -> NotFoundError:
        """创建模板未找到异常"""
        return NotFoundError(
            message=f"模板不存在: {template_id}",
            error_code="TEMPLATE_NOT_FOUND",
            details={"template_id": template_id},
        )

    @staticmethod
    def invalid_content(content: str, reason: str) -> ValidationError:
        """创建内容验证异常"""
        return ValidationError(
            message=f"内容无效: {reason}",
            error_code="INVALID_CONTENT",
            details={"content_length": len(content), "reason": reason},
        )

    @staticmethod
    def quota_exceeded(
        user_id: str,
        operation: str,
        current: int,
        limit: int,
    ) -> QuotaExceededError:
        """创建配额超限异常"""
        return QuotaExceededError(
            message=f"用户 {user_id} 的 {operation} 配额已超限 (当前: {current}, 限制: {limit})",
            error_code="QUOTA_EXCEEDED",
            details={
                "user_id": user_id,
                "operation": operation,
                "current_usage": current,
                "quota_limit": limit,
            },
        )

    @staticmethod
    def service_unavailable(service_name: str) -> ServiceUnavailableError:
        """创建服务不可用异常"""
        return ServiceUnavailableError(
            message=f"服务 {service_name} 不可用",
            error_code="SERVICE_UNAVAILABLE",
            details={"service_name": service_name},
        )

    @staticmethod
    def ai_service_failure(
        service_name: str,
        error: Exception,
    ) -> AIServiceError:
        """创建AI服务异常"""
        return AIServiceError(
            message=f"AI服务 {service_name} 调用失败: {error}",
            error_code="AI_SERVICE_FAILURE",
            details={"service_name": service_name},
            cause=error,
        )

    @staticmethod
    def render_failure(
        template_id: str,
        error: Exception,
    ) -> RenderServiceError:
        """创建渲染服务异常"""
        return RenderServiceError(
            message=f"模板 {template_id} 渲染失败: {error}",
            error_code="RENDER_FAILURE",
            details={"template_id": template_id},
            cause=error,
        )


# 错误码常量
class ErrorCodes:
    """错误码常量"""

    # 通用错误
    INTERNAL_ERROR = "INTERNAL_ERROR"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    CONFLICT = "CONFLICT"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"

    # 业务错误
    CARD_NOT_FOUND = "CARD_NOT_FOUND"
    TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND"
    INVALID_CONTENT = "INVALID_CONTENT"
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"

    # 服务错误
    AI_SERVICE_ERROR = "AI_SERVICE_ERROR"
    RENDER_SERVICE_ERROR = "RENDER_SERVICE_ERROR"
    CACHE_ERROR = "CACHE_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"

    # 配置错误
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR"
    MISSING_ENVIRONMENT_VARIABLE = "MISSING_ENVIRONMENT_VARIABLE"
    INVALID_CONFIGURATION = "INVALID_CONFIGURATION"