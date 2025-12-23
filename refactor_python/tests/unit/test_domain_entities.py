"""
领域层单元测试

测试核心业务逻辑：
- 实体测试 (Entity Tests)
- 值对象测试 (Value Object Tests)
- 领域服务测试 (Domain Service Tests)
- 聚合根测试 (Aggregate Root Tests)
"""

import pytest
from datetime import datetime
from uuid import uuid4

from gzh2xhs_refactor.domain.entities import (
    Card,
    CardId,
    UserId,
    ContentText,
    Timestamp,
    Template,
    GenerationTask,
    DomainError,
    InvalidCardContentError,
    CardNotFoundError,
    TemplateNotFoundError,
)
from gzh2xhs_refactor.shared.types import (
    CardStyle,
    CardSize,
    AIModel,
    DesignSpec,
)


class TestCardId:
    """测试卡片ID值对象"""
    
    def test_generate_new_card_id(self) -> None:
        """测试生成新的卡片ID"""
        card_id = CardId.generate()
        assert isinstance(card_id, CardId)
        assert card_id.value is not None
        assert isinstance(card_id.value, uuid4().__class__)
    
    def test_card_id_str_representation(self) -> None:
        """测试卡片ID字符串表示"""
        card_id = CardId(uuid4())
        assert str(card_id) == str(card_id.value)
    
    def test_card_id_equality(self) -> None:
        """测试卡片ID相等性"""
        uuid_val = uuid4()
        card_id_1 = CardId(uuid_val)
        card_id_2 = CardId(uuid_val)
        
        assert card_id_1 == card_id_2
        assert str(card_id_1) == str(card_id_2)


class TestUserId:
    """测试用户ID值对象"""
    
    def test_create_user_id(self) -> None:
        """测试创建用户ID"""
        user_id = UserId("test_user_123")
        assert user_id.value == "test_user_123"
    
    def test_user_id_str_representation(self) -> None:
        """测试用户ID字符串表示"""
        user_id = UserId("user_456")
        assert str(user_id) == "user_456"


class TestContentText:
    """测试内容文本值对象"""
    
    def test_create_valid_content(self) -> None:
        """测试创建有效内容"""
        content = ContentText("这是一个有效的文本内容")
        assert content.value == "这是一个有效的文本内容"
        assert content.word_count > 0
        assert not content.is_empty
    
    def test_empty_content_raises_error(self) -> None:
        """测试空内容抛出异常"""
        with pytest.raises(InvalidCardContentError):
            ContentText("")
        
        with pytest.raises(InvalidCardContentError):
            ContentText("   ")
    
    def test_content_too_long_raises_error(self) -> None:
        """测试内容过长抛出异常"""
        long_content = "a" * 10001
        with pytest.raises(InvalidCardContentError):
            ContentText(long_content)
    
    def test_word_count(self) -> None:
        """测试字数统计"""
        content = ContentText("Hello world! 这是一个测试。")
        assert content.word_count == len("Hello world! 这是一个测试。")
    
    def test_is_empty_property(self) -> None:
        """测试空内容属性"""
        content_empty = ContentText("")
        assert content_empty.is_empty
        
        content_not_empty = ContentText("有内容的文本")
        assert not content_not_empty.is_empty


class TestTimestamp:
    """测试时间戳值对象"""
    
    def test_create_timestamp(self) -> None:
        """测试创建时间戳"""
        now = datetime.utcnow()
        timestamp = Timestamp(now)
        assert timestamp.value == now
    
    def test_now_factory_method(self) -> None:
        """测试now工厂方法"""
        timestamp = Timestamp.now()
        assert isinstance(timestamp, Timestamp)
        assert isinstance(timestamp.value, datetime)
    
    def test_iso_format(self) -> None:
        """测试ISO格式"""
        now = datetime.utcnow()
        timestamp = Timestamp(now)
        assert timestamp.iso_format == now.isoformat()


class TestCard:
    """测试卡片实体"""
    
    def test_create_card(self) -> None:
        """测试创建卡片"""
        card_id = CardId.generate()
        user_id = UserId("test_user")
        content = ContentText("测试内容")
        
        card = Card(
            id=card_id,
            user_id=user_id,
            template_id="template_001",
            content=content,
            style=CardStyle.STANDARD,
            size=CardSize.RATIO_4_5,
            ai_model=AIModel.DEEPSEEK,
            design_spec=DesignSpec(
                template_type="test",
                color_scheme={},
                layout_config={},
                font_config={},
                element_positions={},
                style_metadata={},
            ),
        )
        
        assert card.id == card_id
        assert card.user_id == user_id
        assert card.content == content
        assert card.status == "draft"
        assert card.can_generate
    
    def test_card_status_transitions(self) -> None:
        """测试卡片状态转换"""
        card = Card(
            id=CardId.generate(),
            user_id=UserId("test_user"),
            template_id="template_001",
            content=ContentText("测试内容"),
            style=CardStyle.STANDARD,
            size=CardSize.RATIO_4_5,
            ai_model=AIModel.DEEPSEEK,
            design_spec=DesignSpec(
                template_type="test",
                color_scheme={},
                layout_config={},
                font_config={},
                element_positions={},
                style_metadata={},
            ),
        )
        
        # 开始生成
        card.start_generation()
        assert card.status == "generating"
        assert card.is_generating
        
        # 完成生成
        from gzh2xhs_refactor.shared.types import RenderResult
        render_result = RenderResult(
            svg_content="<svg>test</svg>",
            success=True,
        )
        card.complete_generation(render_result)
        assert card.status == "completed"
        assert card.is_generated
        assert card.render_result == render_result
        
        # 更新内容
        new_content = ContentText("新的测试内容")
        card.update_content(new_content)
        assert card.status == "draft"
        assert card.content == new_content
    
    def test_card_failed_generation(self) -> None:
        """测试卡片生成失败"""
        card = Card(
            id=CardId.generate(),
            user_id=UserId("test_user"),
            template_id="template_001",
            content=ContentText("测试内容"),
            style=CardStyle.STANDARD,
            size=CardSize.RATIO_4_5,
            ai_model=AIModel.DEEPSEEK,
            design_spec=DesignSpec(
                template_type="test",
                color_scheme={},
                layout_config={},
                font_config={},
                element_positions={},
                style_metadata={},
            ),
        )
        
        card.start_generation()
        card.fail_generation("AI服务错误")
        
        assert card.status == "failed"
        assert card.is_failed
        assert card.metadata["error_message"] == "AI服务错误"
    
    def test_card_cannot_generate_when_completed(self) -> None:
        """测试已完成卡片不能重新生成"""
        card = Card(
            id=CardId.generate(),
            user_id=UserId("test_user"),
            template_id="template_001",
            content=ContentText("测试内容"),
            style=CardStyle.STANDARD,
            size=CardSize.RATIO_4_5,
            ai_model=AIModel.DEEPSEEK,
            design_spec=DesignSpec(
                template_type="test",
                color_scheme={},
                layout_config={},
                font_config={},
                element_positions={},
                style_metadata={},
            ),
        )
        
        # 完成生成
        render_result = RenderResult(
            svg_content="<svg>test</svg>",
            success=True,
        )
        card.complete_generation(render_result)
        
        assert not card.can_generate


class TestTemplate:
    """测试模板实体"""
    
    def test_create_template(self) -> None:
        """测试创建模板"""
        template = Template(
            id="template_001",
            name="测试模板",
            description="这是一个测试模板",
            style=CardStyle.STANDARD,
            config={"layout": "center"},
        )
        
        assert template.id == "template_001"
        assert template.name == "测试模板"
        assert template.is_active
        assert template.is_valid
    
    def test_template_activation(self) -> None:
        """测试模板激活"""
        template = Template(
            id="template_001",
            name="测试模板",
            description="测试",
            style=CardStyle.STANDARD,
            config={},
        )
        
        # 初始状态
        assert template.is_active
        
        # 停用
        template.deactivate()
        assert not template.is_active
        assert template.updated_at is not None
        
        # 重新激活
        template.activate()
        assert template.is_active
    
    def test_template_update_config(self) -> None:
        """测试模板更新配置"""
        template = Template(
            id="template_001",
            name="测试模板",
            description="测试",
            style=CardStyle.STANDARD,
            config={"old": "value"},
        )
        
        new_config = {"new": "value", "updated": True}
        template.update_config(new_config)
        
        assert template.config == new_config
        assert template.updated_at is not None
    
    def test_invalid_template(self) -> None:
        """测试无效模板"""
        template = Template(
            id="template_001",
            name="",  # 空名称
            description="测试",
            style=CardStyle.STANDARD,
            config={},  # 空配置
        )
        
        assert not template.is_valid


class TestGenerationTask:
    """测试生成任务实体"""
    
    def test_create_generation_task(self) -> None:
        """测试创建生成任务"""
        task_id = uuid4()
        card_id = CardId.generate()
        user_id = UserId("test_user")
        
        task = GenerationTask(
            id=task_id,
            card_id=card_id,
            user_id=user_id,
        )
        
        assert task.id == task_id
        assert task.card_id == card_id
        assert task.user_id == user_id
        assert task.status == "pending"
        assert task.progress == 0.0
        assert task.is_pending
    
    def test_task_progress_updates(self) -> None:
        """测试任务进度更新"""
        task = GenerationTask(
            id=uuid4(),
            card_id=CardId.generate(),
            user_id=UserId("test_user"),
        )
        
        task.start()
        assert task.status == "processing"
        assert task.is_processing
        
        task.update_progress(25.0)
        assert task.progress == 25.0
        
        task.update_progress(100.0)
        assert task.progress == 100.0
    
    def test_task_completion(self) -> None:
        """测试任务完成"""
        task = GenerationTask(
            id=uuid4(),
            card_id=CardId.generate(),
            user_id=UserId("test_user"),
        )
        
        task.start()
        
        render_result = RenderResult(
            svg_content="<svg>test</svg>",
            success=True,
        )
        task.complete(render_result)
        
        assert task.status == "completed"
        assert task.is_completed
        assert task.result == render_result
        assert task.completed_at is not None
    
    def test_task_failure(self) -> None:
        """测试任务失败"""
        task = GenerationTask(
            id=uuid4(),
            card_id=CardId.generate(),
            user_id=UserId("test_user"),
        )
        
        task.start()
        
        render_result = RenderResult(
            svg_content="",
            success=False,
            error_message="渲染失败",
        )
        task.complete(render_result)
        
        assert task.status == "failed"
        assert task.is_failed
        assert task.error_message == "渲染失败"
    
    def test_task_cancellation(self) -> None:
        """测试任务取消"""
        task = GenerationTask(
            id=uuid4(),
            card_id=CardId.generate(),
            user_id=UserId("test_user"),
        )
        
        task.cancel()
        assert task.status == "cancelled"
        assert task.is_cancelled
        assert task.completed_at is not None


class TestCardAggregate:
    """测试卡片聚合根"""
    
    def test_create_card_aggregate(self) -> None:
        """测试创建卡片聚合"""
        card = Card(
            id=CardId.generate(),
            user_id=UserId("test_user"),
            template_id="template_001",
            content=ContentText("测试内容"),
            style=CardStyle.STANDARD,
            size=CardSize.RATIO_4_5,
            ai_model=AIModel.DEEPSEEK,
            design_spec=DesignSpec(
                template_type="test",
                color_scheme={},
                layout_config={},
                font_config={},
                element_positions={},
                style_metadata={},
            ),
        )
        
        aggregate = CardAggregate(card)
        assert aggregate.card == card
    
    def test_aggregate_generate_card(self) -> None:
        """测试聚合生成卡片"""
        card = Card(
            id=CardId.generate(),
            user_id=UserId("test_user"),
            template_id="template_001",
            content=ContentText("测试内容"),
            style=CardStyle.STANDARD,
            size=CardSize.RATIO_4_5,
            ai_model=AIModel.DEEPSEEK,
            design_spec=DesignSpec(
                template_type="test",
                color_scheme={},
                layout_config={},
                font_config={},
                element_positions={},
                style_metadata={},
            ),
        )
        
        aggregate = CardAggregate(card)
        task = aggregate.generate_card()
        
        assert isinstance(task, GenerationTask)
        assert task.card_id == card.id
        assert task.user_id == card.user_id
        assert card.status == "generating"
    
    def test_aggregate_cannot_generate_completed_card(self) -> None:
        """测试已完成卡片无法生成"""
        card = Card(
            id=CardId.generate(),
            user_id=UserId("test_user"),
            template_id="template_001",
            content=ContentText("测试内容"),
            style=CardStyle.STANDARD,
            size=CardSize.RATIO_4_5,
            ai_model=AIModel.DEEPSEEK,
            design_spec=DesignSpec(
                template_type="test",
                color_scheme={},
                layout_config={},
                font_config={},
                element_positions={},
                style_metadata={},
            ),
        )
        
        # 完成卡片
        render_result = RenderResult(
            svg_content="<svg>test</svg>",
            success=True,
        )
        card.complete_generation(render_result)
        
        aggregate = CardAggregate(card)
        
        with pytest.raises(DomainError):
            aggregate.generate_card()
    
    def test_aggregate_update_content(self) -> None:
        """测试聚合更新内容"""
        card = Card(
            id=CardId.generate(),
            user_id=UserId("test_user"),
            template_id="template_001",
            content=ContentText("原始内容"),
            style=CardStyle.STANDARD,
            size=CardSize.RATIO_4_5,
            ai_model=AIModel.DEEPSEEK,
            design_spec=DesignSpec(
                template_type="test",
                color_scheme={},
                layout_config={},
                font_config={},
                element_positions={},
                style_metadata={},
            ),
        )
        
        aggregate = CardAggregate(card)
        aggregate.update_card_content("新的内容")
        
        assert card.content.value == "新的内容"
        assert card.status == "draft"


class TestTemplateLibrary:
    """测试模板库聚合根"""
    
    def test_create_template_library(self) -> None:
        """测试创建模板库"""
        templates = [
            Template(
                id="template_001",
                name="模板1",
                description="测试",
                style=CardStyle.STANDARD,
                config={},
                is_active=True,
            ),
            Template(
                id="template_002",
                name="模板2",
                description="测试",
                style=CardStyle.RICH,
                config={},
                is_active=False,
            ),
        ]
        
        library = TemplateLibrary(templates)
        assert len(library._templates) == 2
        assert len(library._active_templates) == 1
    
    def test_get_template(self) -> None:
        """测试获取模板"""
        templates = [
            Template(
                id="template_001",
                name="模板1",
                description="测试",
                style=CardStyle.STANDARD,
                config={},
            ),
        ]
        
        library = TemplateLibrary(templates)
        template = library.get_template("template_001")
        assert template.id == "template_001"
    
    def test_get_nonexistent_template_raises_error(self) -> None:
        """测试获取不存在的模板抛出异常"""
        library = TemplateLibrary([])
        
        with pytest.raises(TemplateNotFoundError):
            library.get_template("nonexistent")
    
    def test_get_active_templates(self) -> None:
        """测试获取激活的模板"""
        templates = [
            Template(
                id="template_001",
                name="模板1",
                description="测试",
                style=CardStyle.STANDARD,
                config={},
                is_active=True,
            ),
            Template(
                id="template_002",
                name="模板2",
                description="测试",
                style=CardStyle.STANDARD,
                config={},
                is_active=False,
            ),
            Template(
                id="template_003",
                name="模板3",
                description="测试",
                style=CardStyle.RICH,
                config={},
                is_active=True,
            ),
        ]
        
        library = TemplateLibrary(templates)
        
        # 获取所有激活模板
        active = library.get_active_templates()
        assert len(active) == 2
        
        # 获取指定样式的激活模板
        standard_active = library.get_active_templates(CardStyle.STANDARD)
        assert len(standard_active) == 1
        assert standard_active[0].id == "template_001"
    
    def test_add_template(self) -> None:
        """测试添加模板"""
        templates = [
            Template(
                id="template_001",
                name="模板1",
                description="测试",
                style=CardStyle.STANDARD,
                config={},
            ),
        ]
        
        library = TemplateLibrary(templates)
        
        new_template = Template(
            id="template_002",
            name="新模板",
            description="测试",
            style=CardStyle.RICH,
            config={},
        )
        
        library.add_template(new_template)
        assert len(library._templates) == 2
        
        # 添加已存在的模板会抛出异常
        with pytest.raises(DomainError):
            library.add_template(new_template)
    
    def test_activate_and_deactivate_template(self) -> None:
        """测试激活和停用模板"""
        template = Template(
            id="template_001",
            name="模板1",
            description="测试",
            style=CardStyle.STANDARD,
            config={},
            is_active=False,
        )
        
        library = TemplateLibrary([template])
        
        library.activate_template("template_001")
        assert template.is_active
        assert "template_001" in library._active_templates
        
        library.deactivate_template("template_001")
        assert not template.is_active
        assert "template_001" not in library._active_templates