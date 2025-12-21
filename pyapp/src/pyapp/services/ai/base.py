from abc import ABC, abstractmethod
from typing import Any

from pyapp.core.exceptions import AIServiceError
from pyapp.core.config import logger
from pyapp.domain.models import DesignJSON, GenerationOptions


class AIService(ABC):
    """Abstract base class for AI services"""

    def __init__(self, provider_name: str):
        self.provider_name = provider_name

    @abstractmethod
    async def process(self, text: str, options: GenerationOptions) -> tuple[str, DesignJSON]:
        """
        Process text and generate SVG content and Design JSON
        
        Args:
            text: Input text
            options: Generation options
            
        Returns:
            Tuple of (svg_content, design_json)
        """
        pass

    def clean_json_response(self, content: str) -> str:
        """Clean markdown code blocks from JSON response"""
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        return content.strip()

    def extract_svg_content(self, content: str) -> str:
        """Extract SVG content from response"""
        content = content.strip()
        if "```svg" in content:
            parts = content.split("```svg")
            if len(parts) > 1:
                content = parts[1].split("```")[0]
        elif "```xml" in content:
            parts = content.split("```xml")
            if len(parts) > 1:
                content = parts[1].split("```")[0]
        elif "```" in content: # Generic code block
             parts = content.split("```")
             if len(parts) > 1:
                 content = parts[1]
                 
        start = content.find("<svg")
        end = content.rfind("</svg>")
        
        if start != -1 and end != -1:
            return content[start : end + 6]
            
        return content
