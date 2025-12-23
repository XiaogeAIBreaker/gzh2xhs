"""
设计模式实现

实现经典设计模式来优化代码结构：
- Factory Pattern: 工厂模式创建对象
- Strategy Pattern: 策略模式切换算法
- Observer Pattern: 观察者模式事件处理
- Builder Pattern: 构建者模式复杂对象创建
- Command Pattern: 命令模式封装操作
- Singleton Pattern: 单例模式全局访问
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Callable, Type, TypeVar
from dataclasses import dataclass, field
from enum import Enum
import logging


logger = logging.getLogger(__name__)

# ==================== Factory Pattern ====================

T = TypeVar("T")


class ProviderFactory:
    """服务提供器工厂模式"""
    
    _providers: Dict[str, Type] = {}
    _instances: Dict[str, Any] = {}
    
    @classmethod
    def register(cls, name: str, provider_class: Type[T]) -> None:
        """注册服务提供器"""
        cls._providers[name.lower()] = provider_class
        logger.info(f"已注册服务提供器: {name} -> {provider_class.__name__}")
    
    @classmethod
    def create(cls, name: str, **kwargs: Any) -> T:
        """创建服务提供器实例"""
        provider_class = cls._providers.get(name.lower())
        if not provider_class:
            raise ValueError(f"未注册的服务提供器: {name}")
        
        return provider_class(**kwargs)
    
    @classmethod
    def get_instance(cls, name: str, **kwargs: Any) -> T:
        """获取单例服务提供器实例"""
        key = f"{name.lower()}_{hash(str(sorted(kwargs.items())))}"
        
        if key not in cls._instances:
            cls._instances[key] = cls.create(name, **kwargs)
        
        return cls._instances[key]


class RendererFactory:
    """渲染器工厂模式"""
    
    _renderers: Dict[str, Type] = {}
    
    @classmethod
    def register(cls, name: str, renderer_class: Type) -> None:
        """注册渲染器"""
        cls._renderers[name.lower()] = renderer_class
    
    @classmethod
    def create(cls, name: str, **kwargs: Any) -> Any:
        """创建渲染器"""
        renderer_class = cls._renderers.get(name.lower())
        if not renderer_class:
            raise ValueError(f"未注册的渲染器: {name}")
        
        return renderer_class(**kwargs)


# ==================== Strategy Pattern ====================

class PricingStrategy(ABC):
    """定价策略抽象基类"""
    
    @abstractmethod
    def calculate_price(
        self,
        base_price: float,
        user_tier: str,
        usage_count: int,
    ) -> float:
        """计算价格"""
        pass


class BasicPricingStrategy(PricingStrategy):
    """基础定价策略"""
    
    def calculate_price(
        self,
        base_price: float,
        user_tier: str,
        usage_count: int,
    ) -> float:
        """基础定价计算"""
        multiplier = 1.0
        
        if user_tier == "premium":
            multiplier = 0.8  # 20%折扣
        elif user_tier == "enterprise":
            multiplier = 0.7  # 30%折扣
        
        # 批量折扣
        if usage_count >= 100:
            multiplier *= 0.9
        elif usage_count >= 50:
            multiplier *= 0.95
        
        return base_price * multiplier


class VolumePricingStrategy(PricingStrategy):
    """批量定价策略"""
    
    def calculate_price(
        self,
        base_price: float,
        user_tier: str,
        usage_count: int,
    ) -> float:
        """批量定价计算"""
        # 阶梯定价
        if usage_count >= 1000:
            price_per_unit = base_price * 0.5
        elif usage_count >= 500:
            price_per_unit = base_price * 0.6
        elif usage_count >= 100:
            price_per_unit = base_price * 0.7
        else:
            price_per_unit = base_price
        
        return price_per_unit * usage_count


class DynamicPricingStrategy(PricingStrategy):
    """动态定价策略"""
    
    def calculate_price(
        self,
        base_price: float,
        user_tier: str,
        usage_count: int,
    ) -> float:
        """动态定价计算"""
        import time
        import random
        
        # 根据时间和负载动态调整
        current_hour = time.localtime().tm_hour
        
        # 高峰期提价
        if 9 <= current_hour <= 11 or 14 <= current_hour <= 16:
            multiplier = 1.2
        # 低峰期降价
        elif 22 <= current_hour or current_hour <= 6:
            multiplier = 0.8
        else:
            multiplier = 1.0
        
        # 用户等级调整
        if user_tier == "premium":
            multiplier *= 0.9
        elif user_tier == "enterprise":
            multiplier *= 0.85
        
        # 随机波动 (±5%)
        random_factor = 1 + random.uniform(-0.05, 0.05)
        
        return base_price * multiplier * random_factor


class PricingContext:
    """定价上下文"""
    
    def __init__(self, strategy: PricingStrategy) -> None:
        self._strategy = strategy
    
    def set_strategy(self, strategy: PricingStrategy) -> None:
        """切换定价策略"""
        self._strategy = strategy
    
    def calculate_price(
        self,
        base_price: float,
        user_tier: str,
        usage_count: int,
    ) -> float:
        """执行定价计算"""
        return self._strategy.calculate_price(base_price, user_tier, usage_count)


# ==================== Observer Pattern ====================

class Subject:
    """观察者模式主题"""
    
    def __init__(self) -> None:
        self._observers: List[Observer] = []
        self._state: Dict[str, Any] = {}
    
    def attach(self, observer: Observer) -> None:
        """添加观察者"""
        if observer not in self._observers:
            self._observers.append(observer)
            logger.debug(f"添加观察者: {observer.__class__.__name__}")
    
    def detach(self, observer: Observer) -> None:
        """移除观察者"""
        try:
            self._observers.remove(observer)
            logger.debug(f"移除观察者: {observer.__class__.__name__}")
        except ValueError:
            logger.warning(f"观察者未找到: {observer.__class__.__name__}")
    
    def notify(self, event: str, data: Dict[str, Any]) -> None:
        """通知所有观察者"""
        logger.info(f"通知观察者: {event}")
        for observer in self._observers:
            try:
                observer.update(event, data)
            except Exception as e:
                logger.error(f"观察者更新失败: {observer.__class__.__name__}, {e}")


class Observer(ABC):
    """观察者抽象基类"""
    
    @abstractmethod
    def update(self, event: str, data: Dict[str, Any]) -> None:
        """更新通知"""
        pass


class MetricsObserver(Observer):
    """指标观察者"""
    
    def __init__(self) -> None:
        self.metrics: Dict[str, Any] = {}
    
    def update(self, event: str, data: Dict[str, Any]) -> None:
        """更新指标"""
        if event == "card_generated":
            self.metrics["total_generations"] = self.metrics.get("total_generations", 0) + 1
            self.metrics["last_generation_time"] = data.get("duration_ms", 0)
        
        elif event == "error_occurred":
            self.metrics["error_count"] = self.metrics.get("error_count", 0) + 1
            self.metrics["last_error"] = data.get("error_message", "")
        
        logger.debug(f"指标更新: {event} -> {self.metrics}")


class AuditObserver(Observer):
    """审计观察者"""
    
    def __init__(self, audit_logger: logging.Logger) -> None:
        self.audit_logger = audit_logger
    
    def update(self, event: str, data: Dict[str, Any]) -> None:
        """记录审计日志"""
        audit_entry = {
            "timestamp": data.get("timestamp"),
            "event": event,
            "user_id": data.get("user_id"),
            "resource_id": data.get("card_id"),
            "details": data,
        }
        
        self.audit_logger.info("审计事件", extra={"audit": audit_entry})


# ==================== Builder Pattern ====================

@dataclass
 class CardConfiguration:
    """卡片配置"""
    template_id: str = ""
    style: str = "standard"
    size: str = "4:5"
    colors: Dict[str, str] = field(default_factory=dict)
    fonts: Dict[str, str] = field(default_factory=dict)
    effects: List[str] = field(default_factory=list)
    custom_css: str = ""
    
    def __post_init__(self) -> None:
        """配置验证"""
        if not self.template_id:
            raise ValueError("模板ID不能为空")


class CardConfigurationBuilder:
    """卡片配置构建器"""
    
    def __init__(self) -> None:
        self._config = CardConfiguration()
    
    def set_template(self, template_id: str) -> CardConfigurationBuilder:
        """设置模板"""
        self._config.template_id = template_id
        return self
    
    def set_style(self, style: str) -> CardConfigurationBuilder:
        """设置样式"""
        self._config.style = style
        return self
    
    def set_size(self, size: str) -> CardConfigurationBuilder:
        """设置尺寸"""
        self._config.size = size
        return self
    
    def add_color(self, name: str, value: str) -> CardConfigurationBuilder:
        """添加颜色"""
        self._config.colors[name] = value
        return self
    
    def add_font(self, name: str, value: str) -> CardConfigurationBuilder:
        """添加字体"""
        self._config.fonts[name] = value
        return self
    
    def add_effect(self, effect: str) -> CardConfigurationBuilder:
        """添加效果"""
        self._config.effects.append(effect)
        return self
    
    def set_custom_css(self, css: str) -> CardConfigurationBuilder:
        """设置自定义CSS"""
        self._config.custom_css = css
        return self
    
    def build(self) -> CardConfiguration:
        """构建配置"""
        return CardConfiguration(
            template_id=self._config.template_id,
            style=self._config.style,
            size=self._config.size,
            colors=self._config.colors.copy(),
            fonts=self._config.fonts.copy(),
            effects=self._config.effects.copy(),
            custom_css=self._config.custom_css,
        )
    
    def reset(self) -> CardConfigurationBuilder:
        """重置构建器"""
        self._config = CardConfiguration()
        return self


# ==================== Command Pattern ====================

class Command(ABC):
    """命令抽象基类"""
    
    @abstractmethod
    async def execute(self) -> Dict[str, Any]:
        """执行命令"""
        pass
    
    @abstractmethod
    async def undo(self) -> Dict[str, Any]:
        """撤销命令"""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """命令描述"""
        pass


class GenerateCardCommand(Command):
    """生成卡片命令"""
    
    def __init__(
        self,
        content: str,
        template_id: str,
        ai_service: Any,
    ) -> None:
        self.content = content
        self.template_id = template_id
        self.ai_service = ai_service
        self.result: Optional[Dict[str, Any]] = None
    
    async def execute(self) -> Dict[str, Any]:
        """执行生成卡片"""
        logger.info(f"执行生成卡片命令: {self.template_id}")
        
        try:
            # 调用AI服务生成
            self.result = await self.ai_service.generate_design_spec(
                text=self.content,
                template_id=self.template_id,
            )
            
            return {"success": True, "result": self.result}
        
        except Exception as e:
            logger.error(f"生成卡片失败: {e}")
            return {"success": False, "error": str(e)}
    
    async def undo(self) -> Dict[str, Any]:
        """撤销生成卡片"""
        if not self.result:
            return {"success": False, "error": "没有可撤销的结果"}
        
        # 在实际应用中，这里应该删除生成的资源
        logger.info("撤销生成卡片命令")
        self.result = None
        return {"success": True, "message": "已撤销生成卡片"}
    
    @property
    def description(self) -> str:
        return f"生成卡片: {self.template_id}"


class ExportCardCommand(Command):
    """导出卡片命令"""
    
    def __init__(
        self,
        card_id: str,
        format: str,
        renderer: Any,
    ) -> None:
        self.card_id = card_id
        self.format = format
        self.renderer = renderer
        self.result: Optional[Dict[str, Any]] = None
    
    async def execute(self) -> Dict[str, Any]:
        """执行导出卡片"""
        logger.info(f"执行导出卡片命令: {self.card_id} -> {self.format}")
        
        try:
            # 调用渲染器导出
            self.result = await self.renderer.export_card(
                card_id=self.card_id,
                format=self.format,
            )
            
            return {"success": True, "result": self.result}
        
        except Exception as e:
            logger.error(f"导出卡片失败: {e}")
            return {"success": False, "error": str(e)}
    
    async def undo(self) -> Dict[str, Any]:
        """撤销导出卡片"""
        if not self.result:
            return {"success": False, "error": "没有可撤销的结果"}
        
        logger.info("撤销导出卡片命令")
        self.result = None
        return {"success": True, "message": "已撤销导出卡片"}
    
    @property
    def description(self) -> str:
        return f"导出卡片: {self.card_id} -> {self.format}"


class CommandInvoker:
    """命令调用者"""
    
    def __init__(self) -> None:
        self._history: List[Command] = []
        self._redo_stack: List[Command] = []
    
    async def execute_command(self, command: Command) -> Dict[str, Any]:
        """执行命令"""
        logger.info(f"执行命令: {command.description}")
        
        result = await command.execute()
        
        if result["success"]:
            self._history.append(command)
            self._redo_stack.clear()  # 清除重做栈
        
        return result
    
    async def undo(self) -> Dict[str, Any]:
        """撤销上一个命令"""
        if not self._history:
            return {"success": False, "error": "没有可撤销的命令"}
        
        command = self._history.pop()
        result = await command.undo()
        
        if result["success"]:
            self._redo_stack.append(command)
        
        return result
    
    async def redo(self) -> Dict[str, Any]:
        """重做上一个撤销的命令"""
        if not self._redo_stack:
            return {"success": False, "error": "没有可重做的命令"}
        
        command = self._redo_stack.pop()
        result = await command.execute()
        
        if result["success"]:
            self._history.append(command)
        
        return result
    
    def get_history(self) -> List[str]:
        """获取命令历史"""
        return [cmd.description for cmd in self._history]


# ==================== Singleton Pattern ====================

class ConfigManager:
    """配置管理器单例"""
    
    _instance: Optional[ConfigManager] = None
    _initialized: bool = False
    
    def __new__(cls) -> ConfigManager:
        """创建单例实例"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self) -> None:
        """初始化单例"""
        if not self._initialized:
            self._config: Dict[str, Any] = {}
            self._initialized = True
            logger.info("配置管理器初始化")
    
    def set(self, key: str, value: Any) -> None:
        """设置配置"""
        self._config[key] = value
        logger.debug(f"设置配置: {key} = {value}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """获取配置"""
        return self._config.get(key, default)
    
    def load_from_dict(self, config_dict: Dict[str, Any]) -> None:
        """从字典加载配置"""
        self._config.update(config_dict)
        logger.info(f"加载配置: {len(config_dict)} 项")
    
    def get_all(self) -> Dict[str, Any]:
        """获取所有配置"""
        return self._config.copy()


class CacheManager:
    """缓存管理器单例"""
    
    _instance: Optional[CacheManager] = None
    
    def __new__(cls) -> CacheManager:
        """创建单例实例"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self) -> None:
        """初始化缓存管理器"""
        self._cache: Dict[str, Any] = {}
        self._ttl: Dict[str, float] = {}
        logger.info("缓存管理器初始化")
    
    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: int = 3600,
    ) -> None:
        """设置缓存"""
        import time
        
        self._cache[key] = value
        self._ttl[key] = time.time() + ttl_seconds
        logger.debug(f"设置缓存: {key} (TTL: {ttl_seconds}s)")
    
    def get(self, key: str) -> Any:
        """获取缓存"""
        import time
        
        if key in self._ttl and time.time() > self._ttl[key]:
            # TTL过期
            self.delete(key)
            return None
        
        return self._cache.get(key)
    
    def delete(self, key: str) -> None:
        """删除缓存"""
        self._cache.pop(key, None)
        self._ttl.pop(key, None)
        logger.debug(f"删除缓存: {key}")
    
    def clear(self) -> None:
        """清空缓存"""
        self._cache.clear()
        self._ttl.clear()
        logger.info("清空所有缓存")
    
    def get_stats(self) -> Dict[str, Any]:
        """获取缓存统计"""
        return {
            "total_keys": len(self._cache),
            "expired_keys": sum(
                1 for ttl in self._ttl.values()
                if ttl < import time; time.time()
            ),
        }


# ==================== Pattern Registry ====================

class PatternRegistry:
    """设计模式注册表"""
    
    def __init__(self) -> None:
        self._factories: Dict[str, Any] = {}
        self._strategies: Dict[str, Type] = {}
        self._builders: Dict[str, Type] = {}
    
    def register_factory(self, name: str, factory: Any) -> None:
        """注册工厂"""
        self._factories[name] = factory
    
    def register_strategy(self, name: str, strategy_class: Type) -> None:
        """注册策略"""
        self._strategies[name] = strategy_class
    
    def register_builder(self, name: str, builder_class: Type) -> None:
        """注册构建器"""
        self._builders[name] = builder_class
    
    def get_factory(self, name: str) -> Any:
        """获取工厂"""
        return self._factories.get(name)
    
    def get_strategy(self, name: str) -> Type:
        """获取策略"""
        return self._strategies.get(name)
    
    def get_builder(self, name: str) -> Type:
        """获取构建器"""
        return self._builders.get(name)


# 全局模式注册表
pattern_registry = PatternRegistry()