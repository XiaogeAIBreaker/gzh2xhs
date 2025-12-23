"""
应用层用例测试

测试具体的业务用例：
- GenerateCardUseCase 测试
- ExportCardUseCase 测试
- GetUserCardsUseCase 测试
- GetTaskStatusUseCase 测试
"""

import pytest
from unittest.mock import AsyncMock, MagicMock

from gzh2xhs_refactor.application.use_cases import (
    GenerateCardUseCase,
    ExportCardUseCase,
    GetUserCardsUseCase,
    GetTaskStatusUseCase,
    GenerateCardInput,
    ExportCardInput,
    GetUserCardsInput,
    GetTaskStatusInput,
)
from gzh2xhs_refactor.domain.entities import GenerationTask, Card, UserId, CardId
from gzh2xhs_refactor.shared.errors import ValidationError, QuotaExceededError
from gzh2xhs_refactor.shared.types import PaginationParams


class TestGenerateCardUseCase:
    """测试生成卡片用例"""
    
    @pytest.fixture
    def mock_card_service(self) -> MagicMock:
        """模拟卡片服务"""
        return MagicMock()
    
    @pytest.fixture
    def mock_cache_service(self) -> MagicMock:
        """模拟缓存服务"""
        return MagicMock()
    
    @pytest.fixture
    def mock_business_rule_service(self) -> MagicMock:
        """模拟业务规则服务"""
        return MagicMock()
    
    @pytest.fixture
    def mock_validation_service(self) -> MagicMock:
        """模拟验证服务"""
        return MagicMock()
    
    @pytest.fixture
    def mock_event_publisher(self) -> MagicMock:
        """模拟事件发布器"""
        return MagicMock()
    
    @pytest.fixture
    def use_case(
        self,
        mock_card_service: MagicMock,
        mock_cache_service: MagicMock,
        mock_business_rule_service: MagicMock,
        mock_validation_service: MagicMock,
        mock_event_publisher: MagicMock,
    ) -> GenerateCardUseCase:
        """创建生成卡片用例实例"""
        return GenerateCardUseCase(
            card_service=mock_card_service,
            cache_service=mock_cache_service,
            business_rule_service=mock_business_rule_service,
            validation_service=mock_validation_service,
            event_publisher=mock_event_publisher,
        )
    
    @pytest.mark.asyncio
    async def test_successful_generation(
        self,
        use_case: GenerateCardUseCase,
        mock_card_service: MagicMock,
        mock_cache_service: MagicMock,
        mock_business_rule_service: MagicMock,
    ) -> None:
        """测试成功生成卡片"""
        # 设置缓存未命中
        mock_cache_service.get_generation_result.return_value = None
        
        # 设置生成任务
        task = GenerationTask(
            id="task_123",
            card_id=CardId.generate(),
            user_id=UserId("user_456"),
        )
        mock_card_service.generate_card.return_value = task
        
        # 执行用例
        input_data = GenerateCardInput(
            text="测试内容",
            model="deepseek",
            user_id="user_456",
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果
        assert result.success
        assert result.task_id == "task_123"
        assert result.card_id == str(task.card_id)
        
        # 验证调用
        mock_validation_service.validate_generation_request.assert_called_once()
        mock_business_rule_service.consume_user_quota.assert_called_once_with(
            "user_456", "generation"
        )
    
    @pytest.mark.asyncio
    async def test_cache_hit(
        self,
        use_case: GenerateCardUseCase,
        mock_cache_service: MagicMock,
        mock_card_service: MagicMock,
    ) -> None:
        """测试缓存命中"""
        # 设置缓存命中
        mock_cache_service.get_generation_result.return_value = {
            "task_id": "cached_task_123",
            "card_id": "cached_card_456",
        }
        
        # 执行用例
        input_data = GenerateCardInput(
            text="测试内容",
            model="deepseek",
            user_id="user_456",
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果
        assert result.success
        assert result.task_id == "cached_task_123"
        assert result.card_id == "cached_card_456"
        
        # 验证未调用卡片服务
        mock_card_service.generate_card.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_validation_error(
        self,
        use_case: GenerateCardUseCase,
        mock_validation_service: MagicMock,
    ) -> None:
        """测试验证错误"""
        # 设置验证失败
        mock_validation_service.validate_generation_request.side_effect = ValidationError(
            message="输入验证失败"
        )
        
        # 执行用例
        input_data = GenerateCardInput(
            text="",  # 空文本会触发验证错误
            model="deepseek",
            user_id="user_456",
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果
        assert not result.success
        assert "输入验证失败" in result.error_message
        assert result.task_id is None
    
    @pytest.mark.asyncio
    async def test_quota_exceeded_error(
        self,
        use_case: GenerateCardUseCase,
        mock_business_rule_service: MagicMock,
    ) -> None:
        """测试配额超限错误"""
        # 设置配额不足
        mock_business_rule_service.is_operation_allowed.return_value = False
        
        # 执行用例
        input_data = GenerateCardInput(
            text="测试内容",
            model="deepseek",
            user_id="user_456",
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果
        assert not result.success
        assert "配额不足" in result.error_message
        assert result.task_id is None


class TestExportCardUseCase:
    """测试导出卡片用例"""
    
    @pytest.fixture
    def mock_cache_service(self) -> MagicMock:
        """模拟缓存服务"""
        return MagicMock()
    
    @pytest.fixture
    def mock_business_rule_service(self) -> MagicMock:
        """模拟业务规则服务"""
        return MagicMock()
    
    @pytest.fixture
    def mock_validation_service(self) -> MagicMock:
        """模拟验证服务"""
        return MagicMock()
    
    @pytest.fixture
    def use_case(
        self,
        mock_cache_service: MagicMock,
        mock_business_rule_service: MagicMock,
        mock_validation_service: MagicMock,
    ) -> ExportCardUseCase:
        """创建导出卡片用例实例"""
        return ExportCardUseCase(
            cache_service=mock_cache_service,
            business_rule_service=mock_business_rule_service,
            validation_service=mock_validation_service,
        )
    
    @pytest.mark.asyncio
    async def test_successful_export(
        self,
        use_case: ExportCardUseCase,
        mock_business_rule_service: MagicMock,
    ) -> None:
        """测试成功导出"""
        # 设置业务规则检查通过
        mock_business_rule_service.is_operation_allowed.return_value = True
        
        # 执行用例
        input_data = ExportCardInput(
            card_ids=["card_1", "card_2"],
            format="png",
            user_id="user_456",
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果
        assert result.success
        assert result.total_count == 2
        assert result.success_count == 2
        assert result.failed_count == 0
        assert len(result.files) == 2
        
        # 验证调用
        mock_validation_service.validate_export_request.assert_called_once_with(
            ["card_1", "card_2"]
        )
        mock_business_rule_service.consume_user_quota.assert_called_once_with(
            "user_456", "export", 2
        )
    
    @pytest.mark.asyncio
    async def test_validation_error(
        self,
        use_case: ExportCardUseCase,
        mock_validation_service: MagicMock,
    ) -> None:
        """测试验证错误"""
        # 设置验证失败
        mock_validation_service.validate_export_request.side_effect = ValidationError(
            message="导出输入验证失败"
        )
        
        # 执行用例
        input_data = ExportCardInput(
            card_ids=[],  # 空列表会触发验证错误
            user_id="user_456",
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果
        assert not result.success
        assert "导出输入验证失败" in result.error_message
        assert result.total_count == 0
        assert result.success_count == 0
        assert result.failed_count == 0
    
    @pytest.mark.asyncio
    async def test_quota_exceeded_error(
        self,
        use_case: ExportCardUseCase,
        mock_business_rule_service: MagicMock,
    ) -> None:
        """测试配额超限错误"""
        # 设置配额不足
        mock_business_rule_service.is_operation_allowed.return_value = False
        
        # 执行用例
        input_data = ExportCardInput(
            card_ids=["card_1"],
            user_id="user_456",
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果
        assert not result.success
        assert "导出配额不足" in result.error_message
        assert result.total_count == 1
        assert result.success_count == 0
        assert result.failed_count == 1


class TestGetUserCardsUseCase:
    """测试获取用户卡片用例"""
    
    @pytest.fixture
    def mock_card_repository(self) -> MagicMock:
        """模拟卡片仓库"""
        return MagicMock()
    
    @pytest.fixture
    def use_case(self, mock_card_repository: MagicMock) -> GetUserCardsUseCase:
        """创建获取用户卡片用例实例"""
        return GetUserCardsUseCase(card_repository=mock_card_repository)
    
    @pytest.mark.asyncio
    async def test_get_user_cards_success(
        self,
        use_case: GetUserCardsUseCase,
        mock_card_repository: MagicMock,
        sample_card: Card,
    ) -> None:
        """测试成功获取用户卡片"""
        # 设置仓库返回数据
        mock_card_repository.get_user_cards.return_value = ([sample_card], 1)
        
        # 执行用例
        input_data = GetUserCardsInput(
            user_id="user_456",
            pagination=PaginationParams(page=1, size=20),
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果
        assert result.success
        assert len(result.cards) == 1
        assert result.pagination.total == 1
        assert result.pagination.page == 1
        assert result.pagination.size == 20
        
        # 验证调用
        mock_card_repository.get_user_cards.assert_called_once_with(
            user_id="user_456",
            page=1,
            size=20,
            status_filter=None,
            style_filter=None,
            sort_by=None,
            sort_order="desc",
        )
    
    @pytest.mark.asyncio
    async def test_get_user_cards_with_filters(
        self,
        use_case: GetUserCardsUseCase,
        mock_card_repository: MagicMock,
    ) -> None:
        """测试带过滤条件的获取用户卡片"""
        # 设置仓库返回数据
        mock_card_repository.get_user_cards.return_value = ([], 0)
        
        # 执行用例
        input_data = GetUserCardsInput(
            user_id="user_456",
            pagination=PaginationParams(page=1, size=10, sort_by="created_at", sort_order="asc"),
            status_filter="completed",
            style_filter="standard",
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果
        assert result.success
        assert len(result.cards) == 0
        assert result.pagination.total == 0
        
        # 验证调用参数
        mock_card_repository.get_user_cards.assert_called_once_with(
            user_id="user_456",
            page=1,
            size=10,
            status_filter="completed",
            style_filter="standard",
            sort_by="created_at",
            sort_order="asc",
        )
    
    @pytest.mark.asyncio
    async def test_get_user_cards_error(
        self,
        use_case: GetUserCardsUseCase,
        mock_card_repository: MagicMock,
    ) -> None:
        """测试获取用户卡片错误"""
        # 设置仓库抛出异常
        mock_card_repository.get_user_cards.side_effect = Exception("数据库错误")
        
        # 执行用例
        input_data = GetUserCardsInput(
            user_id="user_456",
            pagination=PaginationParams(page=1, size=20),
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果
        assert not result.success
        assert "数据库错误" in result.error_message
        assert len(result.cards) == 0
        assert result.pagination.total == 0


class TestGetTaskStatusUseCase:
    """测试获取任务状态用例"""
    
    @pytest.fixture
    def mock_task_repository(self) -> MagicMock:
        """模拟任务仓库"""
        return MagicMock()
    
    @pytest.fixture
    def use_case(self, mock_task_repository: MagicMock) -> GetTaskStatusUseCase:
        """创建获取任务状态用例实例"""
        return GetTaskStatusUseCase(task_repository=mock_task_repository)
    
    @pytest.mark.asyncio
    async def test_get_task_status_success(
        self,
        use_case: GetTaskStatusUseCase,
        mock_task_repository: MagicMock,
    ) -> None:
        """测试成功获取任务状态"""
        # 设置任务
        task = GenerationTask(
            id="task_123",
            card_id=CardId.generate(),
            user_id=UserId("user_456"),
            status="processing",
            progress=50.0,
        )
        mock_task_repository.get_by_id.return_value = task
        
        # 执行用例
        input_data = GetTaskStatusInput(
            task_id="task_123",
            user_id="user_456",
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果
        assert result.success
        assert result.status == "processing"
        assert result.progress == 50.0
        assert result.card_id == str(task.card_id)
        assert result.result_url is None
        assert result.error_message is None
    
    @pytest.mark.asyncio
    async def test_get_completed_task_status(
        self,
        use_case: GetTaskStatusUseCase,
        mock_task_repository: MagicMock,
    ) -> None:
        """测试获取已完成任务状态"""
        # 设置已完成的任务
        from gzh2xhs_refactor.shared.types import RenderResult
        
        task = GenerationTask(
            id="task_123",
            card_id=CardId.generate(),
            user_id=UserId("user_456"),
            status="completed",
            progress=100.0,
            result=RenderResult(
                svg_content="<svg>test</svg>",
                success=True,
            ),
        )
        mock_task_repository.get_by_id.return_value = task
        
        # 执行用例
        input_data = GetTaskStatusInput(
            task_id="task_123",
            user_id="user_456",
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果
        assert result.success
        assert result.status == "completed"
        assert result.progress == 100.0
        assert result.card_id == str(task.card_id)
        assert result.result_url is not None
        assert result.error_message is None
    
    @pytest.mark.asyncio
    async def test_get_failed_task_status(
        self,
        use_case: GetTaskStatusUseCase,
        mock_task_repository: MagicMock,
    ) -> None:
        """测试获取失败任务状态"""
        # 设置失败的任务
        task = GenerationTask(
            id="task_123",
            card_id=CardId.generate(),
            user_id=UserId("user_456"),
            status="failed",
            progress=0.0,
            error_message="AI服务错误",
        )
        mock_task_repository.get_by_id.return_value = task
        
        # 执行用例
        input_data = GetTaskStatusInput(
            task_id="task_123",
            user_id="user_456",
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果
        assert result.success
        assert result.status == "failed"
        assert result.progress == 0.0
        assert result.error_message == "AI服务错误"
        assert result.result_url is None
    
    @pytest.mark.asyncio
    async def test_get_nonexistent_task(
        self,
        use_case: GetTaskStatusUseCase,
        mock_task_repository: MagicMock,
    ) -> None:
        """测试获取不存在的任务"""
        # 设置任务不存在
        mock_task_repository.get_by_id.return_value = None
        
        # 执行用例
        input_data = GetTaskStatusInput(
            task_id="nonexistent",
            user_id="user_456",
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果 - 这里应该抛出NotFoundError，但在用例中被转换为失败结果
        assert not result.success
        assert "任务不存在" in result.error_message
    
    @pytest.mark.asyncio
    async def test_unauthorized_task_access(
        self,
        use_case: GetTaskStatusUseCase,
        mock_task_repository: MagicMock,
    ) -> None:
        """测试未授权的任务访问"""
        # 设置任务属于其他用户
        task = GenerationTask(
            id="task_123",
            card_id=CardId.generate(),
            user_id=UserId("other_user"),  # 不同的用户
            status="pending",
        )
        mock_task_repository.get_by_id.return_value = task
        
        # 执行用例
        input_data = GetTaskStatusInput(
            task_id="task_123",
            user_id="user_456",  # 当前用户
        )
        
        result = await use_case.execute(input_data)
        
        # 验证结果 - 这里应该抛出ValidationError，但在用例中被转换为失败结果
        assert not result.success
        assert "无权访问" in result.error_message