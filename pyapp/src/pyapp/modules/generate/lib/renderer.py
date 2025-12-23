import asyncio
from typing import Optional

from playwright.async_api import async_playwright, Browser
from pyapp.core.config import settings, logger
from pyapp.core.exceptions import ImageGenerationError

CANVAS_WIDTH = 1080
CANVAS_HEIGHT = 1080  # Default 1:1

class PlaywrightRenderer:
    """
    Image Renderer using Playwright for perfect Emoji support
    """
    _browser: Optional[Browser] = None
    _playwright = None
    _lock = asyncio.Lock()

    @classmethod
    async def get_browser(cls) -> Browser:
        async with cls._lock:
            if cls._browser is None:
                logger.info("Launching Playwright Browser...")
                cls._playwright = await async_playwright().start()
                cls._browser = await cls._playwright.chromium.launch(
                    args=["--no-sandbox", "--disable-setuid-sandbox"]
                )
        return cls._browser

    @classmethod
    async def close(cls):
        async with cls._lock:
            if cls._browser:
                await cls._browser.close()
                cls._browser = None
            if cls._playwright:
                await cls._playwright.stop()
                cls._playwright = None

    async def render_svg_to_png(self, svg_content: str) -> bytes:
        """
        Render SVG string to PNG bytes using Playwright
        """
        if not svg_content.strip():
            raise ImageGenerationError("Empty SVG content")

        browser = await self.get_browser()
        page = await browser.new_page()
        
        try:
            await page.set_viewport_size({"width": CANVAS_WIDTH, "height": CANVAS_HEIGHT})
            
            # Wrap SVG in HTML to ensure proper rendering
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ margin: 0; padding: 0; background: transparent; }}
                    svg {{ width: {CANVAS_WIDTH}px; height: {CANVAS_HEIGHT}px; display: block; }}
                </style>
            </head>
            <body>
                {svg_content}
            </body>
            </html>
            """
            
            await page.set_content(html_content, wait_until="domcontentloaded")
            
            # Screenshot
            png_bytes = await page.screenshot(
                type="png",
                clip={"x": 0, "y": 0, "width": CANVAS_WIDTH, "height": CANVAS_HEIGHT}
            )
            
            logger.info(f"Rendered PNG size: {len(png_bytes)} bytes")
            return png_bytes
            
        except Exception as e:
            logger.error(f"Playwright Rendering Error: {e}")
            raise ImageGenerationError(f"Failed to render SVG: {e}")
        finally:
            await page.close()

renderer = PlaywrightRenderer()
