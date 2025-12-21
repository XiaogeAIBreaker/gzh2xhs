import base64
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import Response

from pyapp.api.dependencies import get_image_renderer
from pyapp.services.image.renderer import PlaywrightRenderer
from pyapp.core.config import logger

router = APIRouter()


@router.post("/png")
async def export_png(
    svg: str = Body(..., media_type="text/plain"),
    renderer: PlaywrightRenderer = Depends(get_image_renderer)
):
    """
    Convert SVG content to PNG image
    """
    logger.info("Exporting SVG to PNG")
    try:
        png_bytes = await renderer.render_svg_to_png(svg)
        return Response(content=png_bytes, media_type="image/png")
    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
