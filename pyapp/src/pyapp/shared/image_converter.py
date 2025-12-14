from typing import Tuple
import asyncio
from .concurrency import global_semaphore

async def _convert(svg_content: str) -> Tuple[bytes, str]:
    await asyncio.sleep(0)
    png = svg_content.encode("utf-8")
    mime = "image/png"
    return png, mime

async def convert_svg_to_png(svg_content: str) -> Tuple[bytes, str]:
    return await global_semaphore.run(_convert(svg_content))

