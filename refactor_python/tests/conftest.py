"""
测试工具和配置

提供测试环境的基础设置：
- 测试数据库配置
- 测试夹具 (fixtures)
- 测试数据工厂
- 模拟对象
"""

import asyncio
import pytest
import tempfile
from typing import Any, AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock

from gzh2xhs_refactor.shared.types import (
    GenerationRequest,
    DesignSpec,
    CardStyle,
    CardSize,
    AIModel,
)
from gzh2xhs_refactor.domain.entities import (
    Card,
    CardId,
    UserId,
    ContentText,
    Template,
)
from gzh2xhs_refactor.infrastructure.providers.ai_providers import (
    BaseAIProvider,
    DeepSeekProvider,
    NanoBananaProvider,
)
from gzh2xhs_refactor.infrastructure.services.image_renderer import (
    BaseImageRenderer,
    PlaywrightRenderer,
    RenderOptions,
)


# 测试夹具
@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """创建事件循环夹具"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def temp_dir() -> Generator[str, None, None]:
    """临时目录夹具"""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield temp_dir


@pytest.fixture
def sample_generation_request() -> GenerationRequest:
    """示例生成请求夹具"""
    return GenerationRequest(
        text="这是一篇关于人工智能的公众号文章，讲述了AI技术的发展历程和未来趋势。",
        model=AIModel.DEEPSEEK,
        style=CardStyle.STANDARD,
        size=CardSize.RATIO_4_5,
    )


@pytest.fixture
def sample_design_spec() -> DesignSpec:
    """示例设计规格夹具"""
    return DesignSpec(
        template_type="modern",
        color_scheme={
            "primary": "#4F46E5",
            "secondary": "#7C3AED",
            "background": "#F8FAFC",
            "text": "#1E293B",
        },
        layout_config={
            "header_height": 120,
            "content_margin": 40,
            "footer_height": 80,
        },
        font_config={
            "title_size": 32,
            "content_size": 16,
            "font_family": "Arial",
        },
        element_positions={
            "title": {"x": 50, "y": 50, "width": 980, "height": 60},
            "content": {"x": 50, "y": 150, "width": 980, "height": 1000},
        },
        style_metadata={
            "border_radius": 16,
            "shadow_enabled": True,
            "gradient_enabled": True,
        },
    )


@pytest.fixture
def sample_card() -> Card:
    """示例卡片夹具"""
    return Card(
        id=CardId.generate(),
        user_id=UserId("test_user_123"),
        template_id="template_modern_001",
        content=ContentText("这是一个测试内容，用于测试卡片生成功能。"),
        style=CardStyle.STANDARD,
        size=CardSize.RATIO_4_5,
        ai_model=AIModel.DEEPSEEK,
        design_spec=DesignSpec(
            template_type="test",
            color_scheme={},
            layout_config={},
            font_config={},
            element_positions={},
            style_metadata={},
        ),
    )


@pytest.fixture
def sample_template() -> Template:
    """示例模板夹具"""
    return Template(
        id="template_test_001",
        name="测试模板",
        description="用于测试的模板",
        style=CardStyle.STANDARD,
        config={
            "layout": "center",
            "colors": ["#4F46E5", "#7C3AED"],
            "fonts": {"title": "Arial", "content": "Arial"},
        },
    )


# Mock AI Provider
class MockAIProvider(BaseAIProvider):
    """模拟AI服务提供器"""
    
    def __init__(self, name: str = "MockAI") -> None:
        super().__init__(name)
        self.call_count = 0
    
    async def generate_design_spec(
        self,
        text: str,
        template_config: dict[str, Any],
        style: str,
        options: dict[str, Any],
    ) -> DesignSpec:
        """模拟生成设计规格"""
        self.call_count += 1
        
        return DesignSpec(
            template_type=f"mock_template_{self.call_count}",
            color_scheme={
                "primary": "#4F46E5",
                "secondary": "#7C3AED",
                "background": "#F8FAFC",
            },
            layout_config={
                "header_height": 120,
                "content_margin": 40,
            },
            font_config={
                "title_size": 28,
                "content_size": 16,
            },
            element_positions={
                "title": {"x": 50, "y": 50, "width": 980, "height": 60},
            },
            style_metadata={
                "mock": True,
                "call_count": self.call_count,
            },
        )
    
    async def generate_svg_content(
        self,
        design_spec: DesignSpec,
        style: str,
    ) -> str:
        """模拟生成SVG内容"""
        return f"""<svg width="1080" height="1440" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1440" fill="#F8FAFC"/>
    <text x="540" y="100" text-anchor="middle" font-size="28" fill="#1E293B">
        {design_spec.template_type}
    </text>
    <text x="540" y="200" text-anchor="middle" font-size="16" fill="#4B5563">
        模拟SVG内容 - 风格: {style}
    </text>
</svg>"""
    
    async def _make_api_call(
        self,
        messages: list[dict[str, str]],
        **kwargs: Any,
    ) -> Any:
        """模拟API调用"""
        return MagicMock(
            content="模拟AI响应内容",
            model="mock-model",
            tokens_used=100,
        )


# Mock Image Renderer
class MockImageRenderer(BaseImageRenderer):
    """模拟图像渲染器"""
    
    def __init__(self, name: str = "MockRenderer") -> None:
        super().__init__(name)
        self.render_count = 0
    
    async def initialize(self) -> None:
        """模拟初始化"""
        pass
    
    async def render_svg_to_image(
        self,
        svg_content: str,
        options: RenderOptions,
    ) -> Any:
        """模拟SVG到图像的渲染"""
        self.render_count += 1
        
        # 生成模拟的PNG数据
        mock_png_data = b"Mock PNG Data " * 1000
        
        from gzh2xhs_refactor.infrastructure.services.image_renderer import RenderResult
        
        return RenderResult(
            success=True,
            image_data=mock_png_data,
            size_bytes=len(mock_png_data),
            render_time_ms=50.0 + self.render_count * 10,
            metadata={
                "mock": True,
                "render_count": self.render_count,
                "width": options.width,
                "height": options.height,
            },
        )
    
    async def optimize_image(
        self,
        image_data: bytes,
        quality: str,
    ) -> bytes:
        """模拟图像优化"""
        # 返回略微压缩的数据
        return image_data[:-100] if len(image_data) > 100 else image_data
    
    async def cleanup(self) -> None:
        """模拟清理"""
        pass


@pytest.fixture
def mock_ai_provider() -> MockAIProvider:
    """模拟AI服务提供器夹具"""
    return MockAIProvider()


@pytest.fixture
def mock_image_renderer() -> MockImageRenderer:
    """模拟图像渲染器夹具"""
    return MockImageRenderer()


# 缓存模拟
class MockCache:
    """模拟缓存"""
    
    def __init__(self) -> None:
        self._storage: dict[str, Any] = {}
        self._ttl: dict[str, float] = {}
    
    async def get(self, key: str) -> Any:
        """获取缓存值"""
        import time
        
        if key in self._ttl and time.time() > self._ttl[key]:
            # TTL过期
            self._storage.pop(key, None)
            self._ttl.pop(key, None)
            return None
        
        return self._storage.get(key)
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: int | None = None,
    ) -> bool:
        """设置缓存值"""
        import time
        
        self._storage[key] = value
        if ttl:
            self._ttl[key] = time.time() + ttl
        
        return True
    
    async def delete(self, key: str) -> bool:
        """删除缓存值"""
        self._storage.pop(key, None)
        self._ttl.pop(key, None)
        return True
    
    async def clear(self) -> bool:
        """清空缓存"""
        self._storage.clear()
        self._ttl.clear()
        return True


@pytest.fixture
def mock_cache() -> MockCache:
    """模拟缓存夹具"""
    return MockCache()


# 数据库模拟
class MockDatabase:
    """模拟数据库"""
    
    def __init__(self) -> None:
        self.cards: dict[str, Card] = {}
        self.users: dict[str, Any] = {}
        self.templates: dict[str, Template] = {}
    
    async def save_card(self, card: Card) -> None:
        """保存卡片"""
        self.cards[str(card.id)] = card
    
    async def get_card(self, card_id: str) -> Card | None:
        """获取卡片"""
        return self.cards.get(card_id)
    
    async def get_user_cards(
        self,
        user_id: str,
        page: int = 1,
        size: int = 20,
        **kwargs: Any,
    ) -> tuple[list[Card], int]:
        """获取用户卡片"""
        user_cards = [
            card for card in self.cards.values()
            if str(card.user_id) == user_id
        ]
        
        total = len(user_cards)
        start = (page - 1) * size
        end = start + size
        cards = user_cards[start:end]
        
        return cards, total
    
    async def save_user(self, user: Any) -> None:
        """保存用户"""
        self.users[str(user.id)] = user
    
    async def get_user(self, user_id: str) -> Any | None:
        """获取用户"""
        return self.users.get(user_id)
    
    async def save_template(self, template: Template) -> None:
        """保存模板"""
        self.templates[template.id] = template
    
    async def get_template(self, template_id: str) -> Template | None:
        """获取模板"""
        return self.templates.get(template_id)
    
    async def get_active_templates(
        self,
        style: CardStyle | None = None,
    ) -> list[Template]:
        """获取激活的模板"""
        templates = [t for t in self.templates.values() if t.is_active]
        if style:
            templates = [t for t in templates if t.style == style]
        return templates


@pytest.fixture
def mock_database() -> MockDatabase:
    """模拟数据库夹具"""
    return MockDatabase()


# 测试数据工厂
class TestDataFactory:
    """测试数据工厂"""
    
    @staticmethod
    def create_generation_request(
        text: str = "测试文本内容",
        model: AIModel = AIModel.DEEPSEEK,
        style: CardStyle = CardStyle.STANDARD,
        size: CardSize = CardSize.RATIO_4_5,
    ) -> GenerationRequest:
        """创建生成请求"""
        return GenerationRequest(
            text=text,
            model=model,
            style=style,
            size=size,
        )
    
    @staticmethod
    def create_design_spec(
        template_type: str = "test",
    ) -> DesignSpec:
        """创建设计规格"""
        return DesignSpec(
            template_type=template_type,
            color_scheme={"primary": "#000000"},
            layout_config={},
            font_config={},
            element_positions={},
            style_metadata={},
        )
    
    @staticmethod
    def create_card(
        user_id: str = "test_user",
        content: str = "测试内容",
    ) -> Card:
        """创建卡片"""
        return Card(
            id=CardId.generate(),
            user_id=UserId(user_id),
            template_id="test_template",
            content=ContentText(content),
            style=CardStyle.STANDARD,
            size=CardSize.RATIO_4_5,
            ai_model=AIModel.DEEPSEEK,
            design_spec=TestDataFactory.create_design_spec(),
        )
    
    @staticmethod
    def create_template(
        template_id: str = "test_template",
        name: str = "测试模板",
    ) -> Template:
        """创建模板"""
        return Template(
            id=template_id,
            name=name,
            description="测试模板描述",
            style=CardStyle.STANDARD,
            config={},
        )


@pytest.fixture
def test_data_factory() -> TestDataFactory:
    """测试数据工厂夹具"""
    return TestDataFactory()


# 性能测试辅助
class PerformanceTimer:
    """性能计时器"""
    
    def __init__(self) -> None:
        self.start_time: float = 0.0
        self.end_time: float = 0.0
    
    def start(self) -> None:
        """开始计时"""
        self.start_time = asyncio.get_event_loop().time()
    
    def stop(self) -> float:
        """停止计时并返回耗时(毫秒)"""
        self.end_time = asyncio.get_event_loop().time()
        return (self.end_time - self.start_time) * 1000
    
    def __enter__(self) -> "PerformanceTimer":
        self.start()
        return self
    
    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.stop()


@pytest.fixture
def performance_timer() -> PerformanceTimer:
    """性能计时器夹具"""
    return PerformanceTimer()


# 异步测试辅助
class AsyncTestHelper:
    """异步测试辅助工具"""
    
    @staticmethod
    async def wait_for_condition(
        condition_func: callable,
        timeout: float = 5.0,
        interval: float = 0.1,
    ) -> bool:
        """等待条件满足"""
        import time
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            if await condition_func() if asyncio.iscoroutinefunction(condition_func) else condition_func():
                return True
            await asyncio.sleep(interval)
        return False
    
    @staticmethod
    async def run_with_timeout(
        coro: Any,
        timeout: float = 10.0,
    ) -> Any:
        """带超时的运行协程"""
        return await asyncio.wait_for(coro, timeout=timeout)


@pytest.fixture
def async_test_helper() -> AsyncTestHelper:
    """异步测试辅助工具夹具"""
    return AsyncTestHelper()