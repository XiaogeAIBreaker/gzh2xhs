"""
领域服务

实现核心业务逻辑，遵循DDD原则：
- 独立于技术实现
- 包含重要的业务规则
- 协调多个聚合根
"""

from __future__ import annotations

from typing import Optional, Dict, Any, List
from datetime import datetime
import asyncio
import logging

from ..shared.types import DesignSpec, GenerationRequest, CardStyle
from .entities import (
    Card,
    Template,
    GenerationTask,
    TemplateLibrary,
    CardAggregate,
    DomainError,
    TemplateNotFoundError,
    CardNotFoundError,
)
from ..shared.events import DomainEvent, EventBus


logger = logging.getLogger(__name__)


class AIService:
    """AI分析服务"""
    
    def __init__(
        self,
        deepseek_provider: Any,
        nanobanana_provider: Any,
    ) -> None:
        self._deepseek_provider = deepseek_provider
        self._nanobanana_provider = nanobanana_provider

    async def generate_design_spec(
        self,
        request: GenerationRequest,
        template: Template,
    ) -> DesignSpec:
        """生成设计规格"""
        provider = self._get_provider(request.model)
        
        try:
            logger.info(
                f"开始生成设计规格: model={request.model}, "
                f"template={template.id}, text_length={len(request.text)}"
            )
            
            # 调用AI服务生成设计规格
            design_spec = await provider.generate_design_spec(
                text=request.text,
                template_config=template.config,
                style=request.style,
                options=request.options or {},
            )
            
            logger.info(f"设计规格生成成功: template_type={design_spec.template_type}")
            return design_spec
            
        except Exception as e:
            logger.error(f"生成设计规格失败: {e}")
            raise DomainError(f"AI服务生成设计规格失败: {e}") from e

    async def generate_svg_content(
        self,
        design_spec: DesignSpec,
        style: CardStyle,
    ) -> str:
        """生成SVG内容"""
        try:
            logger.info("开始生成SVG内容")
            
            # 这里应该调用具体的AI provider
            # 简化处理，实际应该根据design_spec生成SVG
            svg_content = f"""<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="600" fill="#f0f0f0"/>
    <text x="200" y="300" text-anchor="middle" font-size="24">
        {design_spec.template_type} - {style.value}
    </text>
</svg>"""
            
            logger.info("SVG内容生成成功")
            return svg_content
            
        except Exception as e:
            logger.error(f"生成SVG内容失败: {e}")
            raise DomainError(f"生成SVG内容失败: {e}") from e

    def _get_provider(self, model: str) -> Any:
        """获取AI provider"""
        if model == "deepseek":
            return self._deepseek_provider
        elif model == "nanobanana":
            return self._nanobanana_provider
        else:
            raise DomainError(f"不支持的AI模型: {model}")


class ImageRenderService:
    """图像渲染服务"""
    
    def __init__(self, renderer: Any) -> None:
        self._renderer = renderer

    async def render_card(
        self,
        svg_content: str,
        size: str,
        quality: str = "high",
    ) -> bytes:
        """渲染卡片为PNG"""
        try:
            logger.info(f"开始渲染卡片: size={size}, quality={quality}")
            
            # 调用渲染器
            png_data = await self._renderer.render_svg_to_png(
                svg_content=svg_content,
                size=size,
                quality=quality,
            )
            
            logger.info(f"卡片渲染成功: size={len(png_data)} bytes")
            return png_data
            
        except Exception as e:
            logger.error(f"渲染卡片失败: {e}")
            raise DomainError(f"渲染卡片失败: {e}") from e

    async def optimize_image(
        self,
        image_data: bytes,
        quality: str,
    ) -> bytes:
        """优化图像"""
        try:
            return await self._renderer.optimize_image(image_data, quality)
        except Exception as e:
            logger.error(f"优化图像失败: {e}")
            raise DomainError(f"优化图像失败: {e}") from e


class CardGenerationService:
    """卡片生成业务服务"""
    
    def __init__(
        self,
        ai_service: AIService,
        render_service: ImageRenderService,
        template_library: TemplateLibrary,
        event_bus: EventBus,
        cache_service: Any,
    ) -> None:
        self._ai_service = ai_service
        self._render_service = render_service
        self._template_library = template_library
        self._event_bus = event_bus
        self._cache_service = cache_service

    async def generate_card(
        self,
        request: GenerationRequest,
        user_id: str,
    ) -> GenerationTask:
        """生成卡片"""
        try:
            # 创建卡片聚合
            card = self._create_card(request, user_id)
            card_aggregate = CardAggregate(card)
            
            # 创建生成任务
            task = card_aggregate.generate_card()
            
            # 发布领域事件
            await self._publish_event(
                "CardGenerationStarted",
                {
                    "task_id": str(task.id),
                    "card_id": str(card.id),
                    "user_id": user_id,
                    "model": request.model,
                    "style": request.style.value,
                },
            )
            
            # 异步执行生成任务
            asyncio.create_task(self._execute_generation(task, card))
            
            logger.info(f"卡片生成任务已创建: task_id={task.id}")
            return task
            
        except Exception as e:
            logger.error(f"创建生成任务失败: {e}")
            raise DomainError(f"生成卡片失败: {e}") from e

    async def _execute_generation(
        self,
        task: GenerationTask,
        card: Card,
    ) -> None:
        """执行生成任务"""
        try:
            logger.info(f"开始执行生成任务: task_id={task.id}")
            
            # 获取模板
            template = self._template_library.get_template(card.template_id)
            
            # 生成设计规格 (20%)
            task.update_progress(20.0)
            design_spec = await self._ai_service.generate_design_spec(
                GenerationRequest(
                    text=card.content.value,
                    model=card.ai_model,
                    style=card.style,
                    size=card.size,
                ),
                template,
            )
            
            # 生成SVG内容 (50%)
            task.update_progress(50.0)
            svg_content = await self._ai_service.generate_svg_content(
                design_spec,
                card.style,
            )
            
            # 渲染图像 (80%)
            task.update_progress(80.0)
            png_data = await self._render_service.render_card(
                svg_content,
                card.size.value,
            )
            
            # 完成生成 (100%)
            render_result = RenderResult(
                svg_content=svg_content,
                png_data=png_data,
                success=True,
            )
            task.complete(render_result)
            
            # 更新卡片
            card.complete_generation(render_result)
            
            # 发布成功事件
            await self._publish_event(
                "CardGenerationCompleted",
                {
                    "task_id": str(task.id),
                    "card_id": str(card.id),
                    "user_id": str(card.user_id),
                    "render_time": 100.0,
                },
            )
            
            logger.info(f"生成任务完成: task_id={task.id}")
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"生成任务执行失败: task_id={task.id}, error={error_msg}")
            
            # 更新任务状态
            task.complete(
                RenderResult(
                    svg_content="",
                    success=False,
                    error_message=error_msg,
                )
            )
            card.fail_generation(error_msg)
            
            # 发布失败事件
            await self._publish_event(
                "CardGenerationFailed",
                {
                    "task_id": str(task.id),
                    "card_id": str(card.id),
                    "user_id": str(card.user_id),
                    "error": error_msg,
                },
            )

    def _create_card(
        self,
        request: GenerationRequest,
        user_id: str,
    ) -> Card:
        """创建卡片"""
        # 选择默认模板（实际应该根据style选择）
        templates = self._template_library.get_active_templates(request.style)
        if not templates:
            raise TemplateNotFoundError(f"没有找到激活的模板: {request.style}")
        
        template = templates[0]
        
        # 创建卡片
        from ..shared.types import CardId, UserId, ContentText
        
        card = Card(
            id=CardId.generate(),
            user_id=UserId(user_id),
            template_id=template.id,
            content=ContentText(request.text),
            style=request.style,
            size=request.size,
            ai_model=request.model,
            design_spec=DesignSpec(
                template_type="default",
                color_scheme={},
                layout_config={},
                font_config={},
                element_positions={},
                style_metadata={},
            ),
        )
        
        return card

    async def _publish_event(
        self,
        event_type: str,
        data: Dict[str, Any],
    ) -> None:
        """发布领域事件"""
        event = DomainEvent(
            event_type=event_type,
            data=data,
            timestamp=datetime.utcnow(),
        )
        await self._event_bus.publish(event_type, data)


class CacheService:
    """缓存服务"""
    
    def __init__(self, cache_backend: Any) -> None:
        self._cache = cache_backend

    async def get_generation_result(
        self,
        request: GenerationRequest,
    ) -> Optional[Dict[str, Any]]:
        """获取缓存的生成结果"""
        key = self._generate_cache_key(request)
        try:
            return await self._cache.get(key)
        except Exception as e:
            logger.warning(f"获取缓存失败: {e}")
            return None

    async def set_generation_result(
        self,
        request: GenerationRequest,
        result: Dict[str, Any],
        ttl: int = 3600,
    ) -> None:
        """缓存生成结果"""
        key = self._generate_cache_key(request)
        try:
            await self._cache.set(key, result, ttl)
        except Exception as e:
            logger.warning(f"设置缓存失败: {e}")

    def _generate_cache_key(self, request: GenerationRequest) -> str:
        """生成缓存键"""
        content_hash = hash(request.text)
        return f"generation:{request.model}:{request.style}:{content_hash}"


class ValidationService:
    """验证服务"""
    
    @staticmethod
    def validate_generation_request(request: GenerationRequest) -> None:
        """验证生成请求"""
        if not request.text.strip():
            raise DomainError("文本内容不能为空")
        
        if len(request.text) > 10000:
            raise DomainError("文本内容过长（最多10000字符）")
        
        if not request.model:
            raise DomainError("AI模型不能为空")
        
        # 可以添加更多验证规则

    @staticmethod
    def validate_export_request(card_ids: List[str]) -> None:
        """验证导出请求"""
        if not card_ids:
            raise DomainError("卡片ID列表不能为空")
        
        if len(card_ids) > 50:
            raise DomainError("单次导出卡片数量不能超过50个")
        
        for card_id in card_ids:
            if not card_id.strip():
                raise DomainError("卡片ID不能为空")


class BusinessRuleService:
    """业务规则服务"""
    
    def __init__(self, user_repository: Any) -> None:
        self._user_repo = user_repository

    async def check_user_quota(
        self,
        user_id: str,
        operation: str = "generation",
    ) -> bool:
        """检查用户配额"""
        try:
            user = await self._user_repo.get_by_id(user_id)
            return user.check_quota(operation) if user else False
        except Exception as e:
            logger.error(f"检查用户配额失败: {e}")
            return False

    async def consume_user_quota(
        self,
        user_id: str,
        operation: str = "generation",
        count: int = 1,
    ) -> None:
        """消耗用户配额"""
        try:
            user = await self._user_repo.get_by_id(user_id)
            if user:
                user.consume_quota(operation, count)
                await self._user_repo.save(user)
        except Exception as e:
            logger.error(f"消耗用户配额失败: {e}")
            raise DomainError(f"消耗用户配额失败: {e}")

    async def is_operation_allowed(
        self,
        user_id: str,
        operation: str,
    ) -> bool:
        """检查操作是否允许"""
        try:
            user = await self._user_repo.get_by_id(user_id)
            if not user or not user.is_active:
                return False
            
            return await self.check_user_quota(user_id, operation)
        except Exception as e:
            logger.error(f"检查操作权限失败: {e}")
            return False