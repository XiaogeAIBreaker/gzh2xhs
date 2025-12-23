"""
日志记录系统

实现结构化日志记录：
- 结构化日志格式
- 不同日志级别
- 请求追踪信息
- 敏感信息脱敏
"""

from __future__ import annotations

import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict, Optional, Union
from contextvars import ContextVar
import structlog
from structlog.typing import EventDict, Processor


# 请求追踪上下文
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar("user_id", default=None)
session_id_var: ContextVar[Optional[str]] = ContextVar("session_id", default=None)


class SensitiveDataFilter:
    """敏感数据过滤处理器"""
    
    SENSITIVE_KEYS = {
        "password", "token", "key", "secret", "api_key", "auth_token",
        "access_token", "refresh_token", "credit_card", "ssn", "email",
        "phone", "address", "name", "username",
    }
    
    def __call__(self, logger: logging.Logger, method_name: str, event_dict: EventDict) -> EventDict:
        """过滤敏感信息"""
        def _filter_dict(obj: Dict[str, Any]) -> Dict[str, Any]:
            """递归过滤字典"""
            filtered = {}
            for key, value in obj.items():
                if isinstance(value, dict):
                    filtered[key] = _filter_dict(value)
                elif isinstance(value, list):
                    filtered[key] = [_filter_dict(item) if isinstance(item, dict) else self._filter_value(key, item) for item in value]
                else:
                    filtered[key] = self._filter_value(key, value)
            return filtered
        
        return _filter_dict(event_dict)
    
    def _filter_value(self, key: str, value: Any) -> Any:
        """过滤单个值"""
        key_lower = key.lower()
        if any(sensitive_key in key_lower for sensitive_key in self.SENSITIVE_KEYS):
            if isinstance(value, str):
                if len(value) <= 4:
                    return "*" * len(value)
                else:
                    return value[:2] + "*" * (len(value) - 4) + value[-2:]
            else:
                return "***"
        return value


class RequestContextProcessor:
    """请求上下文处理器"""
    
    def __call__(self, logger: logging.Logger, method_name: str, event_dict: EventDict) -> EventDict:
        """添加请求上下文"""
        # 添加追踪信息
        event_dict["request_id"] = request_id_var.get()
        event_dict["user_id"] = user_id_var.get()
        event_dict["session_id"] = session_id_var.get()
        
        # 添加时间戳
        if "timestamp" not in event_dict:
            event_dict["timestamp"] = datetime.utcnow().isoformat()
        
        return event_dict


class PerformanceProcessor:
    """性能监控处理器"""
    
    def __init__(self) -> None:
        self.start_times: Dict[str, float] = {}
    
    def start_timer(self, operation: str) -> None:
        """开始计时"""
        self.start_times[operation] = datetime.utcnow().timestamp()
    
    def stop_timer(self, operation: str) -> float:
        """停止计时并返回耗时"""
        if operation in self.start_times:
            duration = datetime.utcnow().timestamp() - self.start_times[operation]
            del self.start_times[operation]
            return duration
        return 0.0
    
    def __call__(self, logger: logging.Logger, method_name: str, event_dict: EventDict) -> EventDict:
        """记录性能信息"""
        if "operation" in event_dict and method_name == "info":
            operation = event_dict["operation"]
            if operation in self.start_times:
                duration = self.stop_timer(operation)
                event_dict["duration_ms"] = round(duration * 1000, 2)
        
        return event_dict


def setup_logging(
    level: str = "INFO",
    format_type: str = "json",
    enable_structured: bool = True,
) -> None:
    """设置日志配置"""
    
    # 配置标准logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, level.upper()),
    )
    
    if enable_structured:
        # 配置structlog
        processors: list[Processor] = [
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            RequestContextProcessor(),
            SensitiveDataFilter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
        ]
        
        if format_type == "json":
            processors.extend([
                structlog.processors.JSONRenderer()
            ])
        else:
            processors.extend([
                structlog.dev.ConsoleRenderer()
            ])
        
        structlog.configure(
            processors=processors,
            wrapper_class=structlog.stdlib.BoundLogger,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )


class LoggerMixin:
    """日志记录器混入类"""
    
    @property
    def logger(self) -> structlog.BoundLogger:
        """获取记录器"""
        return structlog.get_logger(self.__class__.__name__)


# 全局日志记录器
logger = structlog.get_logger(__name__)


# 便捷函数
def get_logger(name: str) -> structlog.BoundLogger:
    """获取记录器"""
    return structlog.get_logger(name)


def set_request_context(
    request_id: Optional[str] = None,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
) -> None:
    """设置请求上下文"""
    if request_id:
        request_id_var.set(request_id)
    if user_id:
        user_id_var.set(user_id)
    if session_id:
        session_id_var.set(session_id)


def clear_request_context() -> None:
    """清除请求上下文"""
    request_id_var.set(None)
    user_id_var.set(None)
    session_id_var.set(None)


# 业务日志记录器
class BusinessLogger:
    """业务日志记录器"""
    
    def __init__(self, logger: structlog.BoundLogger) -> None:
        self.logger = logger
    
    def log_card_generation_started(
        self,
        card_id: str,
        user_id: str,
        model: str,
        style: str,
        template_id: str,
    ) -> None:
        """记录卡片生成开始"""
        self.logger.info(
            "卡片生成开始",
            operation="card_generation",
            card_id=card_id,
            user_id=user_id,
            ai_model=model,
            style=style,
            template_id=template_id,
        )
    
    def log_card_generation_completed(
        self,
        card_id: str,
        user_id: str,
        duration_ms: float,
        svg_length: int,
        success: bool = True,
    ) -> None:
        """记录卡片生成完成"""
        self.logger.info(
            "卡片生成完成" if success else "卡片生成失败",
            operation="card_generation",
            card_id=card_id,
            user_id=user_id,
            duration_ms=duration_ms,
            svg_length=svg_length,
            success=success,
        )
    
    def log_quota_check(
        self,
        user_id: str,
        operation: str,
        current_usage: int,
        quota_limit: int,
        allowed: bool,
    ) -> None:
        """记录配额检查"""
        self.logger.info(
            "配额检查",
            operation="quota_check",
            user_id=user_id,
            operation_type=operation,
            current_usage=current_usage,
            quota_limit=quota_limit,
            allowed=allowed,
        )
    
    def log_api_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> None:
        """记录API请求"""
        self.logger.info(
            "API请求",
            operation="api_request",
            method=method,
            path=path,
            status_code=status_code,
            duration_ms=duration_ms,
            user_id=user_id,
            request_id=request_id,
        )
    
    def log_error(
        self,
        error_type: str,
        error_message: str,
        context: Dict[str, Any],
    ) -> None:
        """记录错误"""
        self.logger.error(
            "应用错误",
            operation="error",
            error_type=error_type,
            error_message=error_message,
            context=context,
        )


# 全局业务日志记录器实例
business_logger = BusinessLogger(logger)