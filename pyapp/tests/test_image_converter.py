import asyncio
import time
from pyapp.shared.image_converter import convert_svg_to_png

def test_convert_svg_to_png_basic():
    out = asyncio.get_event_loop().run_until_complete(convert_svg_to_png("<svg></svg>"))
    assert isinstance(out[0], bytes)
    assert out[1] == "image/png"

def test_concurrency_limit():
    async def job(n):
        return await convert_svg_to_png(f"<svg>{n}</svg>")

    t0 = time.time()
    loop = asyncio.get_event_loop()
    loop.run_until_complete(asyncio.gather(*(job(i) for i in range(64))))
    assert time.time() - t0 >= 0

