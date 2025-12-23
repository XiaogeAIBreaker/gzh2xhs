from typing import Optional, Literal, Any
from pydantic import BaseModel, Field


class GenerationOptions(BaseModel):
    styleChoice: Optional[str] = None
    size: Optional[str] = "1:1"


class GenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    model: str = "deepseek"
    style: Optional[str] = None
    size: Optional[str] = "1:1"
    options: Optional[GenerationOptions] = None


class GeneratedCard(BaseModel):
    id: str
    imageUrl: str
    template: str
    model: str
    size: str


class DesignJSON(BaseModel):
    template_type: str = "standard"
    color_palette: Optional[dict] = None
    typography: Optional[dict] = None
    layout: Optional[dict] = None
    elements: Optional[list] = None
    background: Optional[dict] = None


class GenerateResponse(BaseModel):
    cards: list[GeneratedCard]
    copytext: str
    success: bool
    svgContent: Optional[str] = None
    designJson: Optional[DesignJSON] = None
