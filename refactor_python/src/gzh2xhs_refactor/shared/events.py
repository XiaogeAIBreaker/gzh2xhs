"""
事件系统

实现领域事件驱动架构：
- DomainEvent: 领域事件基类
- EventBus: 事件总线接口
- EventHandler: 事件处理器协议
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Callable, Awaitable, List
import asyncio
import logging
import json

from .types import JsonType


logger = logging.getLogger(__name__)


@dataclass
class DomainEvent:
    """领域事件基类"""
    event_type: str
    data: Dict[str, Any]
    timestamp: datetime
    event_id: str | None = None
    correlation_id: str | None = None
    causation_id: str | None = None
    version: int = 1

    def __post_init__(self) -> None:
        """初始化事件ID"""
        if self.event_id is None:
            import uuid
            self.event_id = str(uuid.uuid4())

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "data": self.data,
            "timestamp": self.timestamp.isoformat(),
            "correlation_id": self.correlation_id,
            "causation_id": self.causation_id,
            "version": self.version,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> DomainEvent:
        """从字典创建事件"""
        return cls(
            event_id=data["event_id"],
            event_type=data["event_type"],
            data=data["data"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            correlation_id=data.get("correlation_id"),
            causation_id=data.get("causation_id"),
            version=data.get("version", 1),
        )


class EventHandler(ABC):
    """事件处理器协议"""

    @abstractmethod
    async def handle(self, event: DomainEvent) -> None:
        """处理事件"""
        pass

    @property
    @abstractmethod
    def event_types(self) -> List[str]:
        """处理的事件类型"""
        pass


class EventBus:
    """事件总线"""

    def __init__(self) -> None:
        self._handlers: Dict[str, List[EventHandler]] = {}
        self._middlewares: List[Callable[[DomainEvent], Awaitable[DomainEvent]]] = []

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        """订阅事件"""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
        logger.info(f"事件处理器已订阅: {event_type}")

    def unsubscribe(self, event_type: str, handler: EventHandler) -> None:
        """取消订阅事件"""
        if event_type in self._handlers:
            try:
                self._handlers[event_type].remove(handler)
                logger.info(f"事件处理器已取消订阅: {event_type}")
            except ValueError:
                logger.warning(f"事件处理器未找到: {event_type}")

    def add_middleware(
        self,
        middleware: Callable[[DomainEvent], Awaitable[DomainEvent]],
    ) -> None:
        """添加中间件"""
        self._middlewares.append(middleware)

    async def publish(self, event: DomainEvent) -> None:
        """发布事件"""
        try:
            # 应用中间件
            processed_event = event
            for middleware in self._middlewares:
                processed_event = await middleware(processed_event)

            # 查找处理器
            handlers = self._handlers.get(event.event_type, [])
            
            if not handlers:
                logger.debug(f"没有找到事件处理器: {event.event_type}")
                return

            # 并发处理事件
            tasks = [handler.handle(processed_event) for handler in handlers]
            await asyncio.gather(*tasks, return_exceptions=True)
            
            logger.debug(f"事件发布成功: {event.event_type} (处理者数量: {len(handlers)})")
            
        except Exception as e:
            logger.error(f"发布事件失败: {event.event_type}, error: {e}")
            raise

    async def publish_batch(self, events: List[DomainEvent]) -> None:
        """批量发布事件"""
        tasks = [self.publish(event) for event in events]
        await asyncio.gather(*tasks, return_exceptions=True)

    def get_subscribers(self, event_type: str) -> List[EventHandler]:
        """获取事件订阅者"""
        return self._handlers.get(event_type, [])

    def clear(self) -> None:
        """清空所有事件处理器"""
        self._handlers.clear()
        self._middlewares.clear()
        logger.info("事件总线已清空")


class LoggingMiddleware:
    """日志中间件"""

    async def __call__(
        self,
        event: DomainEvent,
    ) -> DomainEvent:
        """记录事件日志"""
        logger.info(
            f"发布领域事件: {event.event_type}",
            extra={
                "event_id": event.event_id,
                "event_type": event.event_type,
                "timestamp": event.timestamp.isoformat(),
                "correlation_id": event.correlation_id,
            },
        )
        return event


class TracingMiddleware:
    """链路追踪中间件"""

    async def __call__(
        self,
        event: DomainEvent,
    ) -> DomainEvent:
        """添加链路追踪信息"""
        if not event.correlation_id:
            import uuid
            event.correlation_id = str(uuid.uuid4())
        return event


class DomainEventPublisher:
    """领域事件发布器"""

    def __init__(self, event_bus: EventBus) -> None:
        self._event_bus = event_bus

    async def publish_card_generation_started(
        self,
        card_id: str,
        user_id: str,
        template_id: str,
        ai_model: str,
        style: str,
        correlation_id: str | None = None,
    ) -> None:
        """发布卡片生成开始事件"""
        event = DomainEvent(
            event_type="CardGenerationStarted",
            data={
                "card_id": card_id,
                "user_id": user_id,
                "template_id": template_id,
                "ai_model": ai_model,
                "style": style,
            },
            timestamp=datetime.utcnow(),
            correlation_id=correlation_id,
        )
        await self._event_bus.publish(event)

    async def publish_card_generation_completed(
        self,
        card_id: str,
        user_id: str,
        render_time_ms: float,
        svg_length: int,
        correlation_id: str | None = None,
    ) -> None:
        """发布卡片生成完成事件"""
        event = DomainEvent(
            event_type="CardGenerationCompleted",
            data={
                "card_id": card_id,
                "user_id": user_id,
                "render_time_ms": render_time_ms,
                "svg_length": svg_length,
            },
            timestamp=datetime.utcnow(),
            correlation_id=correlation_id,
        )
        await self._event_bus.publish(event)

    async def publish_card_generation_failed(
        self,
        card_id: str,
        user_id: str,
        error_message: str,
        correlation_id: str | None = None,
    ) -> None:
        """发布卡片生成失败事件"""
        event = DomainEvent(
            event_type="CardGenerationFailed",
            data={
                "card_id": card_id,
                "user_id": user_id,
                "error_message": error_message,
            },
            timestamp=datetime.utcnow(),
            correlation_id=correlation_id,
        )
        await self._event_bus.publish(event)

    async def publish_user_quota_exceeded(
        self,
        user_id: str,
        operation: str,
        current_usage: int,
        quota_limit: int,
        correlation_id: str | None = None,
    ) -> None:
        """发布用户配额超限事件"""
        event = DomainEvent(
            event_type="UserQuotaExceeded",
            data={
                "user_id": user_id,
                "operation": operation,
                "current_usage": current_usage,
                "quota_limit": quota_limit,
            },
            timestamp=datetime.utcnow(),
            correlation_id=correlation_id,
        )
        await self._event_bus.publish(event)


# 内置事件处理器
class AuditEventHandler(EventHandler):
    """审计事件处理器"""

    async def handle(self, event: DomainEvent) -> None:
        """记录审计日志"""
        audit_data = {
            "timestamp": event.timestamp.isoformat(),
            "event_type": event.event_type,
            "user_id": event.data.get("user_id"),
            "resource_id": event.data.get("card_id"),
            "action": event.event_type,
            "details": event.data,
        }
        
        logger.info("审计事件", extra={"audit": audit_data})

    @property
    def event_types(self) -> List[str]:
        return [
            "CardGenerationStarted",
            "CardGenerationCompleted",
            "CardGenerationFailed",
            "UserQuotaExceeded",
        ]


class MetricsEventHandler(EventHandler):
    """指标事件处理器"""

    def __init__(self) -> None:
        self._metrics: Dict[str, int] = {}

    async def handle(self, event: DomainEvent) -> None:
        """收集指标数据"""
        key = f"{event.event_type}_count"
        self._metrics[key] = self._metrics.get(key, 0) + 1
        
        # 记录处理时间指标
        if event.event_type == "CardGenerationCompleted":
            render_time = event.data.get("render_time_ms", 0)
            if render_time > 0:
                timing_key = "avg_render_time_ms"
                current_avg = self._metrics.get(timing_key, 0)
                count = self._metrics.get("CardGenerationCompleted_count", 1)
                new_avg = (current_avg * (count - 1) + render_time) / count
                self._metrics[timing_key] = new_avg

    @property
    def event_types(self) -> List[str]:
        return [
            "CardGenerationStarted",
            "CardGenerationCompleted",
            "CardGenerationFailed",
        ]

    def get_metrics(self) -> Dict[str, Any]:
        """获取指标数据"""
        return self._metrics.copy()


# 事件存储接口
class EventStore(ABC):
    """事件存储接口"""

    @abstractmethod
    async def save_events(self, events: List[DomainEvent]) -> None:
        """保存事件"""
        pass

    @abstractmethod
    async def get_events(
        self,
        aggregate_id: str,
        from_version: int = 0,
    ) -> List[DomainEvent]:
        """获取事件"""
        pass

    @abstractmethod
    async def get_all_events(
        self,
        from_timestamp: datetime | None = None,
    ) -> List[DomainEvent]:
        """获取所有事件"""
        pass


class InMemoryEventStore(EventStore):
    """内存事件存储"""

    def __init__(self) -> None:
        self._events: List[DomainEvent] = []
        self._aggregate_events: Dict[str, List[DomainEvent]] = {}

    async def save_events(self, events: List[DomainEvent]) -> None:
        """保存事件"""
        for event in events:
            self._events.append(event)
            
            # 按聚合ID分组
            aggregate_id = event.data.get("card_id")
            if aggregate_id:
                if aggregate_id not in self._aggregate_events:
                    self._aggregate_events[aggregate_id] = []
                self._aggregate_events[aggregate_id].append(event)

    async def get_events(
        self,
        aggregate_id: str,
        from_version: int = 0,
    ) -> List[DomainEvent]:
        """获取聚合事件"""
        events = self._aggregate_events.get(aggregate_id, [])
        return events[from_version:]

    async def get_all_events(
        self,
        from_timestamp: datetime | None = None,
    ) -> List[DomainEvent]:
        """获取所有事件"""
        if from_timestamp:
            return [e for e in self._events if e.timestamp >= from_timestamp]
        return self._events.copy()