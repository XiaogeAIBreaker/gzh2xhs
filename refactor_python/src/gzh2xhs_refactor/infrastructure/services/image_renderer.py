"""
基础设施层 - 图像渲染服务

实现图像渲染的技术适配器：
- BaseImageRenderer: 图像渲染器基类
- PlaywrightRenderer: Playwright浏览器渲染器实现
- PillowRenderer: Pillow图像处理渲染器实现
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple, List
import asyncio
import io
import base64
import tempfile
import logging
from pathlib import Path

from ..shared.types import CardSize
from ..shared.errors import RenderServiceError, InfrastructureError
from ..shared.logging import business_logger


logger = logging.getLogger(__name__)


@dataclass
class RenderOptions:
    """渲染选项"""
    width: int = 1080
    height: int = 1440
    quality: str = "high"
    format: str = "png"
    dpi: int = 72
    optimize: bool = True
    enable_gradients: bool = True
    enable_shadows: bool = True
    font_family: str = "Arial, sans-serif"
    background_color: str = "#ffffff"


@dataclass
class RenderResult:
    """渲染结果"""
    success: bool
    image_data: Optional[bytes] = None
    file_path: Optional[str] = None
    size_bytes: int = 0
    render_time_ms: float = 0.0
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self) -> None:
        if self.metadata is None:
            self.metadata = {}


class BaseImageRenderer(ABC):
    """图像渲染器基类"""
    
    def __init__(self, name: str) -> None:
        self.name = name
        self._initialized = False
    
    @abstractmethod
    async def initialize(self) -> None:
        """初始化渲染器"""
        pass
    
    @abstractmethod
    async def render_svg_to_image(
        self,
        svg_content: str,
        options: RenderOptions,
    ) -> RenderResult:
        """将SVG渲染为图像"""
        pass
    
    @abstractmethod
    async def optimize_image(
        self,
        image_data: bytes,
        quality: str,
    ) -> bytes:
        """优化图像"""
        pass
    
    @abstractmethod
    async def cleanup(self) -> None:
        """清理资源"""
        pass
    
    async def __aenter__(self) -> BaseImageRenderer:
        """异步上下文管理器入口"""
        await self.initialize()
        self._initialized = True
        return self
    
    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """异步上下文管理器出口"""
        await self.cleanup()


class PlaywrightRenderer(BaseImageRenderer):
    """Playwright浏览器渲染器"""
    
    def __init__(self, browser_type: str = "chromium") -> None:
        super().__init__("Playwright")
        self.browser_type = browser_type
        self.browser = None
        self.context = None
    
    async def initialize(self) -> None:
        """初始化Playwright"""
        try:
            import playwright
            from playwright.async_api import async_playwright
            
            self.playwright = await async_playwright().start()
            self.browser = await getattr(self.playwright, self.browser_type).launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                ],
            )
            self.context = await self.browser.new_context(
                viewport={"width": 1920, "height": 1080},
                device_scale_factor=2,
            )
            
            business_logger.logger.info(
                "Playwright渲染器初始化成功",
                operation="initialize_renderer",
                renderer=self.name,
                browser_type=self.browser_type,
            )
            
        except ImportError:
            raise InfrastructureError(
                message="Playwright未安装，请运行: pip install playwright",
                error_code="PLAYWRIGHT_NOT_INSTALLED",
            )
        except Exception as e:
            logger.error(f"Playwright初始化失败: {e}")
            raise RenderServiceError(
                message=f"Playwright初始化失败: {e}",
                error_code="PLAYWRIGHT_INIT_FAILED",
                cause=e,
            ) from e
    
    async def render_svg_to_image(
        self,
        svg_content: str,
        options: RenderOptions,
    ) -> RenderResult:
        """将SVG渲染为图像"""
        if not self._initialized:
            raise InfrastructureError(
                message="渲染器未初始化",
                error_code="RENDERER_NOT_INITIALIZED",
            )
        
        start_time = asyncio.get_event_loop().time()
        
        try:
            # 创建临时HTML文件
            html_content = self._create_html_template(svg_content, options)
            
            with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False) as f:
                f.write(html_content)
                temp_html_path = f.name
            
            try:
                # 创建新页面
                page = await self.context.new_page()
                
                # 设置视口大小
                await page.set_viewport_size(
                    {"width": options.width, "height": options.height}
                )
                
                # 加载HTML文件
                file_url = f"file://{temp_html_path}"
                await page.goto(file_url, wait_until="networkidle")
                
                # 等待渲染完成
                await page.wait_for_timeout(2000)  # 等待2秒确保完全渲染
                
                # 截图
                screenshot_bytes = await page.screenshot(
                    type=options.format,
                    full_page=True,
                )
                
                await page.close()
                
                render_time = (asyncio.get_event_loop().time() - start_time) * 1000
                
                business_logger.logger.info(
                    "Playwright渲染成功",
                    operation="render_svg",
                    renderer=self.name,
                    format=options.format,
                    size=f"{options.width}x{options.height}",
                    render_time_ms=render_time,
                )
                
                return RenderResult(
                    success=True,
                    image_data=screenshot_bytes,
                    size_bytes=len(screenshot_bytes),
                    render_time_ms=render_time,
                    metadata={
                        "width": options.width,
                        "height": options.height,
                        "format": options.format,
                        "renderer": self.name,
                    },
                )
            
            finally:
                # 清理临时文件
                Path(temp_html_path).unlink(missing_ok=True)
        
        except Exception as e:
            render_time = (asyncio.get_event_loop().time() - start_time) * 1000
            logger.error(f"Playwright渲染失败: {e}")
            
            return RenderResult(
                success=False,
                error_message=str(e),
                render_time_ms=render_time,
            )
    
    async def optimize_image(
        self,
        image_data: bytes,
        quality: str,
    ) -> bytes:
        """优化图像"""
        try:
            # Playwright直接返回的图像已经是优化的
            # 这里可以添加额外的优化逻辑
            
            if quality == "low":
                # 可以添加压缩逻辑
                pass
            
            return image_data
            
        except Exception as e:
            logger.error(f"图像优化失败: {e}")
            raise RenderServiceError(
                message=f"图像优化失败: {e}",
                error_code="IMAGE_OPTIMIZATION_FAILED",
                cause=e,
            ) from e
    
    async def cleanup(self) -> None:
        """清理Playwright资源"""
        try:
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if hasattr(self, "playwright"):
                await self.playwright.stop()
            
            business_logger.logger.info(
                "Playwright渲染器清理完成",
                operation="cleanup_renderer",
                renderer=self.name,
            )
            
        except Exception as e:
            logger.error(f"Playwright清理失败: {e}")
    
    def _create_html_template(
        self,
        svg_content: str,
        options: RenderOptions,
    ) -> str:
        """创建HTML模板"""
        # 注入SVG内容并添加必要的样式
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{
                    margin: 0;
                    padding: 0;
                    background-color: {options.background_color};
                    font-family: {options.font_family};
                    overflow: hidden;
                }}
                .container {{
                    width: {options.width}px;
                    height: {options.height}px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }}
                svg {{
                    max-width: 100%;
                    max-height: 100%;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                {svg_content}
            </div>
        </body>
        </html>
        """
        return html_template


class PillowRenderer(BaseImageRenderer):
    """Pillow图像处理渲染器"""
    
    def __init__(self) -> None:
        super().__init__("Pillow")
        self.temp_dir = None
    
    async def initialize(self) -> None:
        """初始化Pillow"""
        try:
            from PIL import Image, ImageDraw, ImageFont
            
            self.Image = Image
            self.ImageDraw = ImageDraw
            self.ImageFont = ImageFont
            
            # 创建临时目录
            self.temp_dir = tempfile.mkdtemp()
            
            business_logger.logger.info(
                "Pillow渲染器初始化成功",
                operation="initialize_renderer",
                renderer=self.name,
            )
            
        except ImportError:
            raise InfrastructureError(
                message="Pillow未安装，请运行: pip install Pillow",
                error_code="PILLOW_NOT_INSTALLED",
            )
        except Exception as e:
            logger.error(f"Pillow初始化失败: {e}")
            raise RenderServiceError(
                message=f"Pillow初始化失败: {e}",
                error_code="PILLOW_INIT_FAILED",
                cause=e,
            ) from e
    
    async def render_svg_to_image(
        self,
        svg_content: str,
        options: RenderOptions,
    ) -> RenderResult:
        """将SVG渲染为图像 (简化实现)"""
        start_time = asyncio.get_event_loop().time()
        
        try:
            # 这里是一个简化的实现
            # 实际项目中可以使用 cairosvg 或其他 SVG 库
            
            # 创建画布
            image = self.Image.new(
                "RGB",
                (options.width, options.height),
                options.background_color,
            )
            draw = self.ImageDraw.Draw(image)
            
            # 绘制简单的占位内容
            # 实际实现中应该解析SVG并绘制
            
            # 保存图像
            output = io.BytesIO()
            image.save(
                output,
                format=options.format.upper(),
                quality=95 if options.quality == "high" else 75,
            )
            image_data = output.getvalue()
            
            render_time = (asyncio.get_event_loop().time() - start_time) * 1000
            
            business_logger.logger.info(
                "Pillow渲染成功",
                operation="render_svg",
                renderer=self.name,
                format=options.format,
                size=f"{options.width}x{options.height}",
                render_time_ms=render_time,
            )
            
            return RenderResult(
                success=True,
                image_data=image_data,
                size_bytes=len(image_data),
                render_time_ms=render_time,
                metadata={
                    "width": options.width,
                    "height": options.height,
                    "format": options.format,
                    "renderer": self.name,
                },
            )
            
        except Exception as e:
            render_time = (asyncio.get_event_loop().time() - start_time) * 1000
            logger.error(f"Pillow渲染失败: {e}")
            
            return RenderResult(
                success=False,
                error_message=str(e),
                render_time_ms=render_time,
            )
    
    async def optimize_image(
        self,
        image_data: bytes,
        quality: str,
    ) -> bytes:
        """优化图像"""
        try:
            image = self.Image.open(io.BytesIO(image_data))
            
            # 根据质量设置优化参数
            if quality == "low":
                quality_val = 60
            elif quality == "medium":
                quality_val = 80
            else:  # high
                quality_val = 95
            
            # 优化图像
            output = io.BytesIO()
            image.save(
                output,
                format="PNG" if quality == "high" else "JPEG",
                quality=quality_val,
                optimize=True,
            )
            
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"图像优化失败: {e}")
            raise RenderServiceError(
                message=f"图像优化失败: {e}",
                error_code="IMAGE_OPTIMIZATION_FAILED",
                cause=e,
            ) from e
    
    async def cleanup(self) -> None:
        """清理Pillow资源"""
        try:
            if self.temp_dir:
                import shutil
                shutil.rmtree(self.temp_dir, ignore_errors=True)
            
            business_logger.logger.info(
                "Pillow渲染器清理完成",
                operation="cleanup_renderer",
                renderer=self.name,
            )
            
        except Exception as e:
            logger.error(f"Pillow清理失败: {e}")


class ImageRendererFactory:
    """图像渲染器工厂"""
    
    @staticmethod
    def create_renderer(
        renderer_type: str,
        **kwargs: Any,
    ) -> BaseImageRenderer:
        """创建图像渲染器"""
        if renderer_type.lower() == "playwright":
            return PlaywrightRenderer(**kwargs)
        elif renderer_type.lower() == "pillow":
            return PillowRenderer(**kwargs)
        else:
            raise InfrastructureError(
                message=f"不支持的渲染器类型: {renderer_type}",
                error_code="UNSUPPORTED_RENDERER_TYPE",
            )
    
    @staticmethod
    async def create_renderer_with_init(
        renderer_type: str,
        **kwargs: Any,
    ) -> BaseImageRenderer:
        """创建并初始化的图像渲染器"""
        renderer = ImageRendererFactory.create_renderer(renderer_type, **kwargs)
        await renderer.initialize()
        return renderer


class RenderQueue:
    """渲染队列管理器"""
    
    def __init__(
        self,
        max_concurrent: int = 5,
        queue_size: int = 100,
    ) -> None:
        self.max_concurrent = max_concurrent
        self.queue_size = queue_size
        self.active_renders: Dict[str, asyncio.Task] = {}
        self.render_queue: asyncio.Queue = asyncio.Queue(maxsize=queue_size)
        self.semaphore = asyncio.Semaphore(max_concurrent)
    
    async def add_render_task(
        self,
        task_id: str,
        svg_content: str,
        options: RenderOptions,
        renderer: BaseImageRenderer,
    ) -> asyncio.Task:
        """添加渲染任务"""
        if len(self.active_renders) >= self.max_concurrent:
            raise RenderServiceError(
                message="渲染队列已满",
                error_code="RENDER_QUEUE_FULL",
            )
        
        task = asyncio.create_task(
            self._execute_render(task_id, svg_content, options, renderer)
        )
        self.active_renders[task_id] = task
        
        # 设置任务完成回调
        task.add_done_callback(
            lambda t: self.active_renders.pop(task_id, None)
        )
        
        return task
    
    async def _execute_render(
        self,
        task_id: str,
        svg_content: str,
        options: RenderOptions,
        renderer: BaseImageRenderer,
    ) -> RenderResult:
        """执行渲染任务"""
        async with self.semaphore:
            try:
                return await renderer.render_svg_to_image(svg_content, options)
            except Exception as e:
                logger.error(f"渲染任务失败: {task_id}, {e}")
                return RenderResult(
                    success=False,
                    error_message=str(e),
                )
    
    async def get_render_status(self, task_id: str) -> Optional[RenderResult]:
        """获取渲染状态"""
        if task_id in self.active_renders:
            task = self.active_renders[task_id]
            if task.done():
                try:
                    return task.result()
                except Exception:
                    return None
            return None  # 渲染中
        return None  # 任务不存在
    
    async def cancel_render(self, task_id: str) -> bool:
        """取消渲染任务"""
        if task_id in self.active_renders:
            task = self.active_renders[task_id]
            task.cancel()
            return True
        return False
    
    def get_queue_stats(self) -> Dict[str, Any]:
        """获取队列统计"""
        return {
            "active_renders": len(self.active_renders),
            "max_concurrent": self.max_concurrent,
            "queue_size": self.queue_size,
            "running_tasks": list(self.active_renders.keys()),
        }