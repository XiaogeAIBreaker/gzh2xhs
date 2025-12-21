from fastapi import APIRouter, Depends, Response
from fastapi.responses import JSONResponse

from pyapp.api.dependencies import get_ai_service, get_image_renderer
from pyapp.domain.models import GenerateRequest, GenerateResponse, GenerationOptions
from pyapp.services.ai.base import AIService
from pyapp.services.image.renderer import PlaywrightRenderer
from pyapp.core.config import logger

router = APIRouter()


@router.post("/", response_model=GenerateResponse)
async def generate_card(
    request: GenerateRequest,
    ai_service: AIService = Depends(get_ai_service),
    renderer: PlaywrightRenderer = Depends(get_image_renderer)
):
    """
    Generate a Xiaohongshu card from text.
    1. AI Analysis -> Design JSON
    2. AI Rendering -> SVG
    3. (Optional here, but usually next step) SVG -> PNG
    """
    logger.info(f"Received generation request. Model: {ai_service.provider_name}")
    
    options = request.options or GenerationOptions()
    
    # Process with AI
    svg_content, design_json = await ai_service.process(request.text, options)
    
    return GenerateResponse(
        svgContent=svg_content,
        designJson=design_json
    )
