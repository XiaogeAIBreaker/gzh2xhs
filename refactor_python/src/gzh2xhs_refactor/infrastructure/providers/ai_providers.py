"""
基础设施层 - AI服务提供器

实现AI服务的技术适配器：
- BaseAIProvider: AI服务基类
- DeepSeekProvider: DeepSeek AI服务实现
- NanoBananaProvider: NanoBanana AI服务实现
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import json
import asyncio
import httpx
import logging

from ..shared.types import DesignSpec, GenerationOptions
from ..shared.errors import AIServiceError, InfrastructureError
from ..shared.logging import business_logger


logger = logging.getLogger(__name__)


@dataclass
class AIResponse:
    """AI响应"""
    content: str
    model: str
    tokens_used: int = 0
    finish_reason: str = "stop"
    raw_response: Optional[Dict[str, Any]] = None


class BaseAIProvider(ABC):
    """AI服务提供器基类"""
    
    def __init__(self, name: str) -> None:
        self.name = name
        self._client: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self) -> BaseAIProvider:
        """异步上下文管理器入口"""
        self._client = httpx.AsyncClient(timeout=60.0)
        return self
    
    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """异步上下文管理器出口"""
        if self._client:
            await self._client.aclose()
    
    @abstractmethod
    async def generate_design_spec(
        self,
        text: str,
        template_config: Dict[str, Any],
        style: str,
        options: Dict[str, Any],
    ) -> DesignSpec:
        """生成设计规格"""
        pass
    
    @abstractmethod
    async def generate_svg_content(
        self,
        design_spec: DesignSpec,
        style: str,
    ) -> str:
        """生成SVG内容"""
        pass
    
    @abstractmethod
    async def _make_api_call(
        self,
        messages: List[Dict[str, str]],
        **kwargs: Any,
    ) -> AIResponse:
        """发起API调用"""
        pass
    
    def _clean_json_response(self, response: str) -> str:
        """清理JSON响应"""
        # 移除markdown代码块标记
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1].split("```")[0]
        
        # 移除首尾空白字符
        response = response.strip()
        
        return response
    
    def _extract_svg_content(self, response: str) -> str:
        """提取SVG内容"""
        if "<svg" in response and "</svg>" in response:
            start = response.find("<svg")
            end = response.find("</svg>") + len("</svg>")
            return response[start:end]
        
        return response


class DeepSeekProvider(BaseAIProvider):
    """DeepSeek AI服务提供器"""
    
    def __init__(
        self,
        api_key: str,
        api_url: str = "https://api.deepseek.com/chat/completions",
    ) -> None:
        super().__init__("DeepSeek")
        self.api_key = api_key
        self.api_url = api_url
    
    async def generate_design_spec(
        self,
        text: str,
        template_config: Dict[str, Any],
        style: str,
        options: Dict[str, Any],
    ) -> DesignSpec:
        """生成设计规格"""
        try:
            business_logger.logger.info(
                "开始生成设计规格",
                operation="generate_design_spec",
                provider=self.name,
                text_length=len(text),
                style=style,
            )
            
            messages = [
                {
                    "role": "system",
                    "content": self._get_system_prompt(),
                },
                {
                    "role": "user",
                    "content": self._create_user_prompt(text, template_config, style, options),
                },
            ]
            
            response = await self._make_api_call(messages)
            
            # 解析JSON响应
            clean_json = self._clean_json_response(response.content)
            design_data = json.loads(clean_json)
            
            # 构建DesignSpec
            design_spec = DesignSpec(
                template_type=design_data.get("template_type", "default"),
                color_scheme=design_data.get("color_scheme", {}),
                layout_config=design_data.get("layout_config", {}),
                font_config=design_data.get("font_config", {}),
                element_positions=design_data.get("element_positions", {}),
                style_metadata=design_data.get("style_metadata", {}),
            )
            
            business_logger.logger.info(
                "设计规格生成成功",
                operation="generate_design_spec",
                provider=self.name,
                template_type=design_spec.template_type,
            )
            
            return design_spec
            
        except json.JSONDecodeError as e:
            logger.error(f"解析设计规格JSON失败: {e}")
            raise AIServiceError(
                message=f"DeepSeek响应格式错误: 无法解析JSON",
                error_code="INVALID_JSON_RESPONSE",
                cause=e,
            ) from e
        
        except Exception as e:
            logger.error(f"生成设计规格失败: {e}")
            raise AIServiceError(
                message=f"DeepSeek生成设计规格失败: {e}",
                error_code="DESIGN_SPEC_GENERATION_FAILED",
                cause=e,
            ) from e
    
    async def generate_svg_content(
        self,
        design_spec: DesignSpec,
        style: str,
    ) -> str:
        """生成SVG内容"""
        try:
            business_logger.logger.info(
                "开始生成SVG内容",
                operation="generate_svg_content",
                provider=self.name,
                template_type=design_spec.template_type,
                style=style,
            )
            
            messages = [
                {
                    "role": "system",
                    "content": self._get_svg_system_prompt(),
                },
                {
                    "role": "user",
                    "content": self._create_svg_user_prompt(design_spec, style),
                },
            ]
            
            response = await self._make_api_call(messages)
            
            # 提取SVG内容
            svg_content = self._extract_svg_content(response.content)
            
            if not svg_content or "<svg" not in svg_content:
                raise AIServiceError(
                    message="DeepSeek未生成有效的SVG内容",
                    error_code="INVALID_SVG_CONTENT",
                )
            
            business_logger.logger.info(
                "SVG内容生成成功",
                operation="generate_svg_content",
                provider=self.name,
                svg_length=len(svg_content),
            )
            
            return svg_content
            
        except Exception as e:
            logger.error(f"生成SVG内容失败: {e}")
            raise AIServiceError(
                message=f"DeepSeek生成SVG失败: {e}",
                error_code="SVG_GENERATION_FAILED",
                cause=e,
            ) from e
    
    async def _make_api_call(
        self,
        messages: List[Dict[str, str]],
        **kwargs: Any,
    ) -> AIResponse:
        """发起API调用"""
        if not self._client:
            raise InfrastructureError(
                message="HTTP客户端未初始化",
                error_code="HTTP_CLIENT_NOT_INITIALIZED",
            )
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        data = {
            "model": "deepseek-chat",
            "messages": messages,
            "temperature": 1.3,
            "stream": False,
            **kwargs,
        }
        
        try:
            response = await self._client.post(
                self.api_url,
                headers=headers,
                json=data,
            )
            
            if response.status_code != 200:
                error_msg = f"DeepSeek API错误: {response.status_code} - {response.text}"
                logger.error(error_msg)
                raise AIServiceError(
                    message=error_msg,
                    error_code="DEEPSEEK_API_ERROR",
                )
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            return AIResponse(
                content=content,
                model="deepseek-chat",
                tokens_used=result.get("usage", {}).get("total_tokens", 0),
                raw_response=result,
            )
        
        except httpx.RequestError as e:
            logger.error(f"DeepSeek网络请求失败: {e}")
            raise AIServiceError(
                message=f"DeepSeek网络请求失败: {e}",
                error_code="DEEPSEEK_NETWORK_ERROR",
                cause=e,
            ) from e
    
    def _get_system_prompt(self) -> str:
        """获取系统提示词"""
        return """你是一个专业的视觉设计师，专门设计小红书风格的卡片。

你的任务是分析给定的文本内容，并生成一个设计规格JSON，包含以下字段：
- template_type: 模板类型 (simple/standard/rich)
- color_scheme: 配色方案 (主色、辅助色、背景色等)
- layout_config: 布局配置 (标题位置、内容区域、图片区域等)
- font_config: 字体配置 (字体大小、粗细、颜色等)
- element_positions: 元素位置 (具体坐标和尺寸)
- style_metadata: 样式元数据 (风格标签、特效等)

请基于文本内容的情感、主题和风格，选择合适的视觉元素和配色方案。
确保设计既美观又符合小红书平台的用户喜好。

输出格式：严格的JSON，不要包含任何其他文字。"""

    def _create_user_prompt(
        self,
        text: str,
        template_config: Dict[str, Any],
        style: str,
        options: Dict[str, Any],
    ) -> str:
        """创建用户提示词"""
        return f"""请为以下文本内容设计一个{style}风格的小红书卡片：

文本内容：
{text}

模板配置：{json.dumps(template_config, ensure_ascii=False, indent=2)}

样式偏好：{style}

额外选项：{json.dumps(options, ensure_ascii=False, indent=2)}

请生成完整的设计规格JSON。"""

    def _get_svg_system_prompt(self) -> str:
        """获取SVG生成系统提示词"""
        return """你是一个SVG代码生成专家，专门创建小红书风格的卡片。

基于给定的设计规格，生成完整的SVG代码，包含：
1. 完整的SVG标签结构
2. 适当的视图框设置
3. 渐变和阴影效果
4. 文字排版和样式
5. 视觉层次和对比度

要求：
- 生成标准的SVG代码
- 确保在不同尺寸下都能正常显示
- 注重视觉效果和用户体验
- 符合现代设计趋势

请直接输出SVG代码，不要包含任何解释或markdown标记。"""

    def _create_svg_user_prompt(
        self,
        design_spec: DesignSpec,
        style: str,
    ) -> str:
        """创建SVG生成用户提示词"""
        return f"""基于以下设计规格生成SVG代码：

设计规格：
{json.dumps({
    "template_type": design_spec.template_type,
    "color_scheme": design_spec.color_scheme,
    "layout_config": design_spec.layout_config,
    "font_config": design_spec.font_config,
    "element_positions": design_spec.element_positions,
    "style_metadata": design_spec.style_metadata,
}, ensure_ascii=False, indent=2)}

样式偏好：{style}

请生成完整的小红书风格卡片SVG代码，尺寸为1080x1440像素。"""


class NanoBananaProvider(BaseAIProvider):
    """NanoBanana AI服务提供器"""
    
    def __init__(
        self,
        api_key: str,
        api_url: str = "https://kg-api.cloud/v1/chat/completions",
    ) -> None:
        super().__init__("NanoBanana")
        self.api_key = api_key
        self.api_url = api_url
    
    async def generate_design_spec(
        self,
        text: str,
        template_config: Dict[str, Any],
        style: str,
        options: Dict[str, Any],
    ) -> DesignSpec:
        """生成设计规格"""
        try:
            business_logger.logger.info(
                "开始生成设计规格",
                operation="generate_design_spec",
                provider=self.name,
                text_length=len(text),
                style=style,
            )
            
            messages = [
                {
                    "role": "system",
                    "content": self._get_system_prompt(),
                },
                {
                    "role": "user",
                    "content": self._create_user_prompt(text, template_config, style, options),
                },
            ]
            
            response = await self._make_api_call(messages)
            
            # 解析JSON响应
            clean_json = self._clean_json_response(response.content)
            design_data = json.loads(clean_json)
            
            # 构建DesignSpec
            design_spec = DesignSpec(
                template_type=design_data.get("template_type", "default"),
                color_scheme=design_data.get("color_scheme", {}),
                layout_config=design_data.get("layout_config", {}),
                font_config=design_data.get("font_config", {}),
                element_positions=design_data.get("element_positions", {}),
                style_metadata=design_data.get("style_metadata", {}),
            )
            
            business_logger.logger.info(
                "设计规格生成成功",
                operation="generate_design_spec",
                provider=self.name,
                template_type=design_spec.template_type,
            )
            
            return design_spec
            
        except Exception as e:
            logger.error(f"NanoBanana生成设计规格失败: {e}")
            raise AIServiceError(
                message=f"NanoBanana生成设计规格失败: {e}",
                error_code="NANOBANANA_DESIGN_SPEC_FAILED",
                cause=e,
            ) from e
    
    async def generate_svg_content(
        self,
        design_spec: DesignSpec,
        style: str,
    ) -> str:
        """生成SVG内容"""
        try:
            business_logger.logger.info(
                "开始生成SVG内容",
                operation="generate_svg_content",
                provider=self.name,
                template_type=design_spec.template_type,
                style=style,
            )
            
            messages = [
                {
                    "role": "system",
                    "content": self._get_svg_system_prompt(),
                },
                {
                    "role": "user",
                    "content": self._create_svg_user_prompt(design_spec, style),
                },
            ]
            
            response = await self._make_api_call(messages)
            
            # 提取SVG内容
            svg_content = self._extract_svg_content(response.content)
            
            business_logger.logger.info(
                "SVG内容生成成功",
                operation="generate_svg_content",
                provider=self.name,
                svg_length=len(svg_content),
            )
            
            return svg_content
            
        except Exception as e:
            logger.error(f"NanoBanana生成SVG失败: {e}")
            raise AIServiceError(
                message=f"NanoBanana生成SVG失败: {e}",
                error_code="NANOBANANA_SVG_FAILED",
                cause=e,
            ) from e
    
    async def _make_api_call(
        self,
        messages: List[Dict[str, str]],
        **kwargs: Any,
    ) -> AIResponse:
        """发起API调用"""
        if not self._client:
            raise InfrastructureError(
                message="HTTP客户端未初始化",
                error_code="HTTP_CLIENT_NOT_INITIALIZED",
            )
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        data = {
            "model": "nanobanana-chat",
            "messages": messages,
            "temperature": 1.3,
            "stream": False,
            **kwargs,
        }
        
        try:
            response = await self._client.post(
                self.api_url,
                headers=headers,
                json=data,
            )
            
            if response.status_code != 200:
                error_msg = f"NanoBanana API错误: {response.status_code} - {response.text}"
                logger.error(error_msg)
                raise AIServiceError(
                    message=error_msg,
                    error_code="NANOBANANA_API_ERROR",
                )
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            return AIResponse(
                content=content,
                model="nanobanana-chat",
                tokens_used=result.get("usage", {}).get("total_tokens", 0),
                raw_response=result,
            )
        
        except Exception as e:
            logger.error(f"NanoBanana网络请求失败: {e}")
            raise AIServiceError(
                message=f"NanoBanana网络请求失败: {e}",
                error_code="NANOBANANA_NETWORK_ERROR",
                cause=e,
            ) from e
    
    def _get_system_prompt(self) -> str:
        """获取系统提示词"""
        return DeepSeekProvider._get_system_prompt(self)
    
    def _create_user_prompt(
        self,
        text: str,
        template_config: Dict[str, Any],
        style: str,
        options: Dict[str, Any],
    ) -> str:
        """创建用户提示词"""
        return DeepSeekProvider._create_user_prompt(self, text, template_config, style, options)
    
    def _get_svg_system_prompt(self) -> str:
        """获取SVG生成系统提示词"""
        return DeepSeekProvider._get_svg_system_prompt(self)
    
    def _create_svg_user_prompt(
        self,
        design_spec: DesignSpec,
        style: str,
    ) -> str:
        """创建SVG生成用户提示词"""
        return DeepSeekProvider._create_svg_user_prompt(self, design_spec, style)


# AI服务工厂
class AIServiceFactory:
    """AI服务工厂"""
    
    @staticmethod
    def create_provider(
        provider_name: str,
        api_key: str,
        api_url: str,
    ) -> BaseAIProvider:
        """创建AI服务提供器"""
        if provider_name.lower() == "deepseek":
            return DeepSeekProvider(api_key, api_url)
        elif provider_name.lower() == "nanobanana":
            return NanoBananaProvider(api_key, api_url)
        else:
            raise InfrastructureError(
                message=f"不支持的AI服务提供器: {provider_name}",
                error_code="UNSUPPORTED_AI_PROVIDER",
            )
    
    @staticmethod
    async def create_provider_with_client(
        provider_name: str,
        api_key: str,
        api_url: str,
    ) -> BaseAIProvider:
        """创建带HTTP客户端的AI服务提供器"""
        provider = AIServiceFactory.create_provider(provider_name, api_key, api_url)
        await provider.__aenter__()
        return provider