"""
应用层用例 (Use Cases)

实现具体的业务用例：
- GenerateCardUseCase: 生成卡片用例
- ExportCardUseCase: 导出卡片用例
- 管理用户偏好和配额
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any, List
import asyncio

from ..domain.services import (
    CardGenerationService,
    CacheService,
    BusinessRuleService,
    ValidationService,
)
from ..domain.entities import (
    GenerationTask,
    Card,
    User,
)
from ..shared.types import (
    GenerationRequest,
    ExportRequest,
    ExportResult,
    GeneratedCard,
    GenerateResponse,
    PaginationParams,
    PaginatedResult,
)
from ..shared.events import DomainEventPublisher
from ..shared.logging import business_logger, set_request_context
from ..shared.errors import (
    BaseAppError,
    NotFoundError,
    ValidationError,
    QuotaExceededError,
    BusinessErrorFactory,
)


@dataclass
class GenerateCardInput:
    """生成卡片输入"""
    text: str
    model: str
    style: str = "standard"
    size: str = "4:5"
    user_id: str
    template_id: Optional[str] = None
    options: Optional[Dict[str, Any]] = None


@dataclass
class GenerateCardOutput:
    """生成卡片输出"""
    success: bool
    task_id: Optional[str] = None
    card_id: Optional[str] = None
    error_message: Optional[str] = None
    estimated_time_seconds: int = 30


class GenerateCardUseCase:
    """生成卡片用例"""
    
    def __init__(
        self,
        card_service: CardGenerationService,
        cache_service: CacheService,
        business_rule_service: BusinessRuleService,
        validation_service: ValidationService,
        event_publisher: DomainEventPublisher,
    ) -> None:
        self._card_service = card_service
        self._cache_service = cache_service
        self._business_rule_service = business_rule_service
        self._validation_service = validation_service
        self._event_publisher = event_publisher
    
    async def execute(self, input_data: GenerateCardInput) -> GenerateCardOutput:
        """执行生成卡片用例"""
        try:
            # 设置请求上下文
            set_request_context(
                user_id=input_data.user_id,
            )
            
            business_logger.logger.info(
                "开始执行生成卡片用例",
                operation="generate_card",
                user_id=input_data.user_id,
                text_length=len(input_data.text),
            )
            
            # 1. 验证输入
            self._validate_input(input_data)
            
            # 2. 检查业务规则和配额
            await self._check_business_rules(input_data)
            
            # 3. 检查缓存
            cache_result = await self._check_cache(input_data)
            if cache_result:
                business_logger.logger.info("缓存命中", operation="generate_card")
                return GenerateCardOutput(
                    success=True,
                    task_id=cache_result.get("task_id"),
                    card_id=cache_result.get("card_id"),
                )
            
            # 4. 创建生成请求
            request = GenerationRequest(
                text=input_data.text,
                model=input_data.model,
                style=input_data.style,
                size=input_data.size,
                options=input_data.options,
                session_id=None,
            )
            
            # 5. 执行生成
            task = await self._card_service.generate_card(
                request=request,
                user_id=input_data.user_id,
            )
            
            # 6. 消耗配额
            await self._business_rule_service.consume_user_quota(
                input_data.user_id,
                "generation",
            )
            
            business_logger.logger.info(
                "生成卡片用例执行成功",
                operation="generate_card",
                task_id=str(task.id),
                user_id=input_data.user_id,
            )
            
            return GenerateCardOutput(
                success=True,
                task_id=str(task.id),
                card_id=str(task.card_id),
            )
            
        except BaseAppError as e:
            business_logger.logger.error(
                "生成卡片用例执行失败",
                operation="generate_card",
                error_code=e.error_code,
                error_message=e.message,
                user_id=input_data.user_id,
            )
            
            return GenerateCardOutput(
                success=False,
                error_message=e.message,
            )
        
        except Exception as e:
            business_logger.logger.error(
                "生成卡片用例执行异常",
                operation="generate_card",
                error_type=type(e).__name__,
                error_message=str(e),
                user_id=input_data.user_id,
            )
            
            return GenerateCardOutput(
                success=False,
                error_message="生成卡片时发生未知错误",
            )
    
    def _validate_input(self, input_data: GenerateCardInput) -> None:
        """验证输入"""
        try:
            self._validation_service.validate_generation_request(
                GenerationRequest(
                    text=input_data.text,
                    model=input_data.model,
                    style=input_data.style,
                    size=input_data.size,
                )
            )
        except Exception as e:
            raise ValidationError(
                message=f"输入验证失败: {e}",
                error_code="INVALID_INPUT",
            ) from e
    
    async def _check_business_rules(self, input_data: GenerateCardInput) -> None:
        """检查业务规则"""
        # 检查操作是否允许
        allowed = await self._business_rule_service.is_operation_allowed(
            input_data.user_id,
            "generation",
        )
        
        if not allowed:
            raise QuotaExceededError(
                message=f"用户 {input_data.user_id} 配额不足或操作不允许",
                error_code="QUOTA_EXCEEDED",
                details={"user_id": input_data.user_id},
            )
    
    async def _check_cache(
        self,
        input_data: GenerateCardInput,
    ) -> Optional[Dict[str, Any]]:
        """检查缓存"""
        request = GenerationRequest(
            text=input_data.text,
            model=input_data.model,
            style=input_data.style,
            size=input_data.size,
        )
        
        try:
            return await self._cache_service.get_generation_result(request)
        except Exception:
            # 缓存失败不影响主要流程
            return None


@dataclass
class ExportCardInput:
    """导出卡片输入"""
    card_ids: List[str]
    format: str = "png"
    quality: str = "high"
    user_id: str
    batch_mode: bool = False


@dataclass
class ExportCardOutput:
    """导出卡片输出"""
    success: bool
    files: List[Dict[str, str]]
    total_count: int
    success_count: int
    failed_count: int
    error_message: Optional[str] = None


class ExportCardUseCase:
    """导出卡片用例"""
    
    def __init__(
        self,
        cache_service: CacheService,
        business_rule_service: BusinessRuleService,
        validation_service: ValidationService,
    ) -> None:
        self._cache_service = cache_service
        self._business_rule_service = business_rule_service
        self._validation_service = validation_service
    
    async def execute(self, input_data: ExportCardInput) -> ExportCardOutput:
        """执行导出卡片用例"""
        try:
            business_logger.logger.info(
                "开始执行导出卡片用例",
                operation="export_card",
                user_id=input_data.user_id,
                card_count=len(input_data.card_ids),
                format=input_data.format,
            )
            
            # 1. 验证输入
            self._validate_input(input_data)
            
            # 2. 检查配额
            await self._check_quota(input_data)
            
            # 3. 执行导出
            export_request = ExportRequest(
                card_ids=input_data.card_ids,
                format=input_data.format,
                quality=input_data.quality,
                batch_mode=input_data.batch_mode,
            )
            
            # 这里应该调用具体的导出服务
            # 简化处理，返回模拟结果
            files = []
            success_count = 0
            failed_count = 0
            
            for card_id in input_data.card_ids:
                try:
                    # 模拟导出成功
                    files.append({
                        "card_id": card_id,
                        "url": f"https://cdn.example.com/cards/{card_id}.{input_data.format}",
                        "format": input_data.format,
                    })
                    success_count += 1
                except Exception:
                    failed_count += 1
            
            # 4. 消耗配额
            await self._business_rule_service.consume_user_quota(
                input_data.user_id,
                "export",
                len(input_data.card_ids),
            )
            
            business_logger.logger.info(
                "导出卡片用例执行成功",
                operation="export_card",
                user_id=input_data.user_id,
                total_count=len(input_data.card_ids),
                success_count=success_count,
                failed_count=failed_count,
            )
            
            return ExportCardOutput(
                success=True,
                files=files,
                total_count=len(input_data.card_ids),
                success_count=success_count,
                failed_count=failed_count,
            )
            
        except BaseAppError as e:
            business_logger.logger.error(
                "导出卡片用例执行失败",
                operation="export_card",
                error_code=e.error_code,
                error_message=e.message,
                user_id=input_data.user_id,
            )
            
            return ExportCardOutput(
                success=False,
                files=[],
                total_count=len(input_data.card_ids),
                success_count=0,
                failed_count=len(input_data.card_ids),
                error_message=e.message,
            )
        
        except Exception as e:
            business_logger.logger.error(
                "导出卡片用例执行异常",
                operation="export_card",
                error_type=type(e).__name__,
                error_message=str(e),
                user_id=input_data.user_id,
            )
            
            return ExportCardOutput(
                success=False,
                files=[],
                total_count=len(input_data.card_ids),
                success_count=0,
                failed_count=len(input_data.card_ids),
                error_message="导出卡片时发生未知错误",
            )
    
    def _validate_input(self, input_data: ExportCardInput) -> None:
        """验证输入"""
        try:
            self._validation_service.validate_export_request(input_data.card_ids)
        except Exception as e:
            raise ValidationError(
                message=f"导出输入验证失败: {e}",
                error_code="INVALID_EXPORT_INPUT",
            ) from e
    
    async def _check_quota(self, input_data: ExportCardInput) -> None:
        """检查配额"""
        allowed = await self._business_rule_service.is_operation_allowed(
            input_data.user_id,
            "export",
        )
        
        if not allowed:
            raise QuotaExceededError(
                message=f"用户 {input_data.user_id} 导出配额不足",
                error_code="EXPORT_QUOTA_EXCEEDED",
                details={"user_id": input_data.user_id},
            )


@dataclass
class GetUserCardsInput:
    """获取用户卡片输入"""
    user_id: str
    pagination: PaginationParams
    status_filter: Optional[str] = None
    style_filter: Optional[str] = None


@dataclass
class GetUserCardsOutput:
    """获取用户卡片输出"""
    success: bool
    cards: List[GeneratedCard]
    pagination: PaginatedResult[GeneratedCard]
    error_message: Optional[str] = None


class GetUserCardsUseCase:
    """获取用户卡片用例"""
    
    def __init__(self, card_repository: Any) -> None:
        self._card_repo = card_repository
    
    async def execute(self, input_data: GetUserCardsInput) -> GetUserCardsOutput:
        """执行获取用户卡片用例"""
        try:
            # 从仓库获取卡片
            cards, total = await self._card_repo.get_user_cards(
                user_id=input_data.user_id,
                page=input_data.pagination.page,
                size=input_data.pagination.size,
                status_filter=input_data.status_filter,
                style_filter=input_data.style_filter,
                sort_by=input_data.pagination.sort_by,
                sort_order=input_data.pagination.sort_order,
            )
            
            # 转换为输出格式
            generated_cards = [
                GeneratedCard(
                    id=str(card.id),
                    image_url=f"https://cdn.example.com/cards/{card.id}.png",
                    template=card.template_id,
                    model=card.ai_model.value,
                    size=card.size.value,
                    svg_content=card.render_result.svg_content if card.render_result else "",
                    design_spec=card.design_spec,
                )
                for card in cards
            ]
            
            # 构建分页结果
            pages = (total + input_data.pagination.size - 1) // input_data.pagination.size
            pagination_result = PaginatedResult(
                items=generated_cards,
                total=total,
                page=input_data.pagination.page,
                size=input_data.pagination.size,
                pages=pages,
                has_next=input_data.pagination.page < pages,
                has_prev=input_data.pagination.page > 1,
            )
            
            return GetUserCardsOutput(
                success=True,
                cards=generated_cards,
                pagination=pagination_result,
            )
            
        except Exception as e:
            business_logger.logger.error(
                "获取用户卡片失败",
                operation="get_user_cards",
                error_type=type(e).__name__,
                error_message=str(e),
                user_id=input_data.user_id,
            )
            
            return GetUserCardsOutput(
                success=False,
                cards=[],
                pagination=PaginatedResult(
                    items=[],
                    total=0,
                    page=1,
                    size=20,
                    pages=0,
                    has_next=False,
                    has_prev=False,
                ),
                error_message=str(e),
            )


@dataclass
class GetTaskStatusInput:
    """获取任务状态输入"""
    task_id: str
    user_id: str


@dataclass
class GetTaskStatusOutput:
    """获取任务状态输出"""
    success: bool
    status: str
    progress: float
    card_id: Optional[str] = None
    error_message: Optional[str] = None
    result_url: Optional[str] = None


class GetTaskStatusUseCase:
    """获取任务状态用例"""
    
    def __init__(self, task_repository: Any) -> None:
        self._task_repo = task_repository
    
    async def execute(self, input_data: GetTaskStatusInput) -> GetTaskStatusOutput:
        """执行获取任务状态用例"""
        try:
            # 从仓库获取任务
            task = await self._task_repo.get_by_id(input_data.task_id)
            
            if not task:
                raise NotFoundError(
                    message=f"任务不存在: {input_data.task_id}",
                    error_code="TASK_NOT_FOUND",
                )
            
            # 验证任务归属
            if str(task.user_id) != input_data.user_id:
                raise ValidationError(
                    message="无权访问该任务",
                    error_code="UNAUTHORIZED_TASK_ACCESS",
                )
            
            # 构建输出
            output = GetTaskStatusOutput(
                success=True,
                status=task.status,
                progress=task.progress,
                card_id=str(task.card_id) if task.card_id else None,
            )
            
            # 如果任务完成，添加结果URL
            if task.is_completed and task.result:
                output.result_url = f"https://cdn.example.com/cards/{task.card_id}.png"
            elif task.is_failed:
                output.error_message = task.error_message
            
            return output
            
        except BaseAppError:
            raise
        
        except Exception as e:
            business_logger.logger.error(
                "获取任务状态失败",
                operation="get_task_status",
                error_type=type(e).__name__,
                error_message=str(e),
                task_id=input_data.task_id,
            )
            
            return GetTaskStatusOutput(
                success=False,
                status="unknown",
                progress=0.0,
                error_message=str(e),
            )