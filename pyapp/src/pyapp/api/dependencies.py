from typing import Annotated

from fastapi import Depends, Header, HTTPException

from pyapp.services.ai.base import AIService
from pyapp.services.ai.deepseek import DeepSeekService
from pyapp.services.ai.nanobanana import NanoBananaService
from pyapp.services.image.renderer import PlaywrightRenderer, renderer


async def get_ai_service(x_model: Annotated[str | None, Header()] = "deepseek") -> AIService:
    """
    Factory dependency to get AI service based on header.
    Defaults to DeepSeek.
    """
    if x_model == "nanobanana":
        return NanoBananaService()
    return DeepSeekService()


def get_image_renderer() -> PlaywrightRenderer:
    """Dependency for Image Renderer"""
    return renderer
