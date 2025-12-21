import pytest
from pyapp.services.ai.base import AIService
from pyapp.domain.models import GenerationOptions

class ConcreteAIService(AIService):
    async def process(self, text, options):
        pass

def test_clean_json_response():
    service = ConcreteAIService("Test")
    
    # Test Markdown blocks
    assert service.clean_json_response("```json\n{\"a\": 1}\n```") == "{\"a\": 1}"
    assert service.clean_json_response("```\n{\"a\": 1}\n```") == "{\"a\": 1}"
    assert service.clean_json_response("{\"a\": 1}") == "{\"a\": 1}"

def test_extract_svg_content():
    service = ConcreteAIService("Test")
    
    # Test Markdown blocks
    svg = "<svg>...</svg>"
    assert service.extract_svg_content(f"```svg\n{svg}\n```") == svg
    assert service.extract_svg_content(f"```xml\n{svg}\n```") == svg
    assert service.extract_svg_content(svg) == svg
    
    # Test with surrounding text
    assert service.extract_svg_content(f"Here is svg: {svg} thanks") == svg
