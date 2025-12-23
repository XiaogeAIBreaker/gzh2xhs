"""
类型定义模块

提供整个项目使用的公共类型定义，包括：
- 基础数据类型
- 业务实体类型
- DTO类型
- 通用接口类型
"""

from typing import (
    Any,
    Dict,
    List,
    Optional,
    Protocol,
    Type,
    Union,
    Generic,
    TypeVar,
    Callable,
    Awaitable,
    Literal,
)
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

# 基础类型别名
JsonType = Union[Dict[str, Any], List[Any], str, int, float, bool, None]
PrimitiveType = Union[str, int, float, bool, None]

# 业务常量
class CardStyle(Enum):
    """卡片样式枚举"""
    SIMPLE = "simple"
    STANDARD = "standard"
    RICH = "rich"


class CardSize(Enum):
    """卡片尺寸枚举"""
    RATIO_1_1 = "1:1"  # 正方形
    RATIO_4_5 = "4:5"  # 4:5 (小红书标准)
    RATIO_16_9 = "16:9"  # 16:9
    RATIO_9_16 = "9:16"  # 9:16


class AIModel(Enum):
    """AI模型枚举"""
    DEEPSEEK = "deepseek"
    NANOBANANA = "nanobanana"


class RenderEngine(Enum):
    """渲染引擎枚举"""
    PLAYWRIGHT = "playwright"
    PIL = "pillow"
    CANVAS = "canvas"


# 泛型类型变量
T = TypeVar("T")
U = TypeVar("U")
R = TypeVar("R")


# 数据传输对象 (DTO)
@dataclass(frozen=True)
class GenerationRequest:
    """卡片生成请求"""
    text: str
    model: AIModel
    style: CardStyle = CardStyle.STANDARD
    size: CardSize = CardSize.RATIO_4_5
    options: Optional[Dict[str, Any]] = None
    session_id: Optional[UUID] = field(default_factory=uuid4)
    request_id: Optional[str] = None

    def __post_init__(self) -> None:
        """后处理验证"""
        if not self.text.strip():
            raise ValueError("文本内容不能为空")
        if self.request_id is None:
            object.__setattr__(self, "request_id", str(uuid4()))


@dataclass(frozen=True)
class DesignSpec:
    """设计规格"""
    template_type: str
    color_scheme: Dict[str, str]
    layout_config: Dict[str, Any]
    font_config: Dict[str, str]
    element_positions: Dict[str, Dict[str, float]]
    style_metadata: Dict[str, Any]


@dataclass(frozen=True)
class RenderResult:
    """渲染结果"""
    svg_content: str
    png_data: Optional[bytes] = None
    image_url: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    render_time_ms: float = 0.0
    success: bool = True
    error_message: Optional[str] = None


@dataclass(frozen=True)
class GeneratedCard:
    """生成的卡片"""
    id: str
    image_url: str
    template: str
    model: str
    size: str
    svg_content: str
    design_spec: DesignSpec
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass(frozen=True)
class GenerateResponse:
    """生成响应"""
    cards: List[GeneratedCard]
    copytext: str
    success: bool = True
    svg_content: Optional[str] = None
    design_json: Optional[DesignSpec] = None
    execution_time_ms: float = 0.0
    cache_hit: bool = False


@dataclass(frozen=True)
class ExportRequest:
    """导出请求"""
    card_ids: List[str]
    format: Literal["png", "svg", "pdf"] = "png"
    quality: Literal["low", "medium", "high"] = "high"
    batch_mode: bool = False


@dataclass(frozen=True)
class ExportResult:
    """导出结果"""
    success: bool
    files: List[Dict[str, str]]
    total_count: int
    success_count: int
    failed_count: int
    execution_time_ms: float = 0.0


# 协议接口 (Protocol)
class CacheBackend(Protocol):
    """缓存后端协议"""

    async def get(self, key: str) -> Optional[Any]:
        """获取缓存值"""
        ...

    async def set(
        self, key: str, value: Any, ttl: Optional[int] = None
    ) -> bool:
        """设置缓存值"""
        ...

    async def delete(self, key: str) -> bool:
        """删除缓存值"""
        ...

    async def clear(self) -> bool:
        """清空缓存"""
        ...


class AIService(Protocol):
    """AI服务协议"""

    async def generate_design_spec(
        self, text: str, options: Dict[str, Any]
    ) -> DesignSpec:
        """生成设计规格"""
        ...

    async def generate_svg_content(
        self, design_spec: DesignSpec, style: CardStyle
    ) -> str:
        """生成SVG内容"""
        ...


class ImageRenderer(Protocol):
    """图像渲染器协议"""

    async def render_svg_to_png(
        self, svg_content: str, size: CardSize
    ) -> bytes:
        """将SVG渲染为PNG"""
        ...

    async def optimize_image(
        self, image_data: bytes, quality: str
    ) -> bytes:
        """优化图像"""
        ...


class EventBus(Protocol):
    """事件总线协议"""

    async def publish(self, event: str, data: Dict[str, Any]) -> None:
        """发布事件"""
        ...

    def subscribe(
        self, event: str, handler: Callable[[Dict[str, Any]], Awaitable[None]]
    ) -> None:
        """订阅事件"""
        ...


# 配置类
@dataclass
class AppConfig:
    """应用配置"""
    app_name: str = "gzh2xhs-refactor"
    version: str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    
    # API配置
    api_prefix: str = "/api/v1"
    cors_origins: List[str] = field(default_factory=lambda: ["*"])
    
    # AI服务配置
    deepseek_api_key: Optional[str] = None
    deepseek_api_url: str = "https://api.deepseek.com/chat/completions"
    nanobanana_api_key: Optional[str] = None
    nanobanana_api_url: str = "https://kg-api.cloud/v1/chat/completions"
    
    # 缓存配置
    cache_backend: Literal["memory", "redis"] = "memory"
    cache_ttl: int = 3600  # 1小时
    redis_url: Optional[str] = None
    
    # 渲染配置
    render_engine: RenderEngine = RenderEngine.PLAYWRIGHT
    max_concurrent_renders: int = 5
    render_timeout: int = 30
    
    # 日志配置
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    log_format: Literal["json", "text"] = "json"
    enable_structured_logging: bool = True
    
    # 监控配置
    enable_metrics: bool = True
    metrics_port: int = 9090
    sentry_dsn: Optional[str] = None


# 结果类型
class Result(Generic[T], Protocol):
    """结果类型的协议"""

    @property
    def is_success(self) -> bool:
        """是否成功"""
        ...

    @property
    def value(self) -> Optional[T]:
        """成功值"""
        ...

    @property
    def error(self) -> Optional[Exception]:
        """错误信息"""
        ...


# 分页类型
@dataclass(frozen=True)
class PaginationParams:
    """分页参数"""
    page: int = 1
    size: int = 20
    sort_by: Optional[str] = None
    sort_order: Literal["asc", "desc"] = "desc"

    def __post_init__(self) -> None:
        """验证分页参数"""
        if self.page < 1:
            raise ValueError("页码必须大于0")
        if self.size < 1 or self.size > 100:
            raise ValueError("页面大小必须在1-100之间")


@dataclass(frozen=True)
class PaginatedResult(Generic[T]):
    """分页结果"""
    items: List[T]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool