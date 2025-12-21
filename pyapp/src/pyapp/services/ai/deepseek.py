import json
import httpx
from typing import Any

from pyapp.core.config import settings, logger
from pyapp.core.exceptions import AIServiceError
from pyapp.domain.models import DesignJSON, GenerationOptions
from pyapp.services.ai.base import AIService
from pyapp.services.prompts import (
    STAGE_A_SYSTEM_PROMPT,
    STAGE_B_SYSTEM_PROMPT,
    create_stage_a_user_prompt,
    create_stage_b_user_prompt,
)


class DeepSeekService(AIService):
    """DeepSeek AI Service Implementation"""

    def __init__(self):
        super().__init__("DeepSeek")
        self.api_key = settings.DEEPSEEK_API_KEY
        self.api_url = settings.DEEPSEEK_API_URL

    async def _call_api(self, messages: list[dict[str, str]]) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        data = {
            "model": "deepseek-chat",
            "messages": messages,
            "temperature": 1.3, # Creative mode
            "stream": False
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.api_url, headers=headers, json=data
                )
                
                if response.status_code != 200:
                    error_msg = f"DeepSeek API Error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    raise AIServiceError(error_msg)
                
                result = response.json()
                return result["choices"][0]["message"]["content"]
                
        except httpx.RequestError as e:
            logger.error(f"DeepSeek Network Error: {e}")
            raise AIServiceError(f"Network error connecting to DeepSeek: {e}")
        except Exception as e:
            logger.error(f"DeepSeek Unexpected Error: {e}")
            raise AIServiceError(f"Unexpected error in DeepSeek service: {e}")

    async def process(self, text: str, options: GenerationOptions) -> tuple[str, DesignJSON]:
        logger.info(f"Starting DeepSeek processing for text length: {len(text)}")
        
        # Stage A: Analysis & Design
        stage_a_prompt = create_stage_a_user_prompt(text, options.model_dump())
        messages_a = [
            {"role": "system", "content": STAGE_A_SYSTEM_PROMPT},
            {"role": "user", "content": stage_a_prompt},
        ]
        
        try:
            raw_json = await self._call_api(messages_a)
            clean_json = self.clean_json_response(raw_json)
            design_data = json.loads(clean_json)
            design_json = DesignJSON(**design_data)
            logger.info(f"Stage A complete. Template: {design_json.template_type}")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Design JSON: {e}. Content: {raw_json}")
            raise AIServiceError("Failed to generate valid Design JSON")
        except Exception as e:
             raise AIServiceError(f"Stage A failed: {e}")

        # Stage B: SVG Rendering
        stage_b_prompt = create_stage_b_user_prompt(
            clean_json, options.styleChoice
        )
        messages_b = [
            {"role": "system", "content": STAGE_B_SYSTEM_PROMPT},
            {"role": "user", "content": stage_b_prompt},
        ]
        
        try:
            raw_svg = await self._call_api(messages_b)
            svg_content = self.extract_svg_content(raw_svg)
            
            if not svg_content or "<svg" not in svg_content:
                raise AIServiceError("No valid SVG content generated")
                
            logger.info(f"Stage B complete. SVG length: {len(svg_content)}")
            return svg_content, design_json
            
        except Exception as e:
            raise AIServiceError(f"Stage B failed: {e}")
