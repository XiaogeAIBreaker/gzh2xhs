import hashlib
import json
import time
from typing import Optional

from pyapp.core.config import settings, logger
from pyapp.modules.generate import schemas
from pyapp.modules.generate.providers.deepseek import DeepSeekService
from pyapp.modules.generate.lib.renderer import renderer

# Simple in-memory cache for demo if Redis fails/not setup
_memory_cache = {}

class GenerateService:
    def __init__(self):
        self.ai_service = DeepSeekService()
        self.renderer = renderer

    async def generate_card(self, input_dto: schemas.GenerateRequest) -> schemas.GenerateResponse:
        cache_key = self._make_cache_key(input_dto)
        
        # Check cache (Mocking Redis get)
        if cache_key in _memory_cache:
            logger.info(f"Cache hit for {cache_key}")
            return schemas.GenerateResponse(**_memory_cache[cache_key])

        options = input_dto.options or schemas.GenerationOptions()
        
        # 1. AI Process
        svg_content, design_json = await self.ai_service.process(input_dto.text, options)
        
        # 2. Render Image
        png_bytes = await self.renderer.render_svg_to_png(svg_content)
        
        # In a real app, upload png_bytes to S3/Cloud and get URL.
        # Here we return a data URL or placeholder.
        # For simplicity, let's assume we return a base64 data url or a temp url.
        # Since I can't easily upload, I'll just say "generated_image.png"
        image_url = f"https://placeholder.com/{input_dto.model}-card.png" 
        
        # 3. Build Output
        cards = [
            schemas.GeneratedCard(
                id=f"{input_dto.model}-{int(time.time())}",
                imageUrl=image_url,
                template=design_json.template_type,
                model=input_dto.model,
                size=input_dto.size or "1:1"
            )
        ]
        
        response = schemas.GenerateResponse(
            cards=cards,
            copytext="Generated copytext placeholder",
            success=True,
            svgContent=svg_content,
            designJson=design_json
        )
        
        # Set cache
        _memory_cache[cache_key] = response.model_dump()
        
        return response

    def _make_cache_key(self, input_dto: schemas.GenerateRequest) -> str:
        raw = f"{input_dto.text}:{input_dto.model}:{input_dto.style}:{input_dto.size}"
        return hashlib.sha256(raw.encode()).hexdigest()

generate_service = GenerateService()
