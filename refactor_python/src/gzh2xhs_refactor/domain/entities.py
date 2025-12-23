"""
领域模型 - 核心业务实体

包含项目的核心业务概念和规则：
- Card: 卡片实体
- Template: 模板实体  
- User: 用户实体
- GenerationTask: 生成任务实体
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID, uuid4

from ..shared.types import (
    CardStyle,
    CardSize,
    AIModel,
    RenderResult,
    DesignSpec,
)


class DomainError(Exception):
    """领域异常基类"""
    pass


class InvalidCardContentError(DomainError):
    """无效卡片内容异常"""
    pass


class CardNotFoundError(DomainError):
    """卡片未找到异常"""
    pass


class TemplateNotFoundError(DomainError):
    """模板未找到异常"""
    pass


# 值对象
@dataclass(frozen=True)
class CardId:
    """卡片ID值对象"""
    value: UUID

    def __str__(self) -> str:
        return str(self.value)

    @classmethod
    def generate(cls) -> CardId:
        """生成新的卡片ID"""
        return cls(uuid4())


@dataclass(frozen=True)
class UserId:
    """用户ID值对象"""
    value: str

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True)
class ContentText:
    """内容文本值对象"""
    value: str

    def __post_init__(self) -> None:
        """验证内容"""
        if not self.value.strip():
            raise InvalidCardContentError("内容不能为空")
        if len(self.value) > 10000:
            raise InvalidCardContentError("内容长度不能超过10000字符")

    @property
    def word_count(self) -> int:
        """获取字数"""
        return len(self.value.strip())

    @property
    def is_empty(self) -> bool:
        """是否为空"""
        return not self.value.strip()


@dataclass(frozen=True)
class Timestamp:
    """时间戳值对象"""
    value: datetime

    @classmethod
    def now(cls) -> Timestamp:
        """获取当前时间"""
        return cls(datetime.utcnow())

    @property
    def iso_format(self) -> str:
        """ISO格式时间字符串"""
        return self.value.isoformat()


# 实体
@dataclass
class Template:
    """模板实体"""
    id: str
    name: str
    description: str
    style: CardStyle
    config: Dict[str, Any]
    preview_url: Optional[str] = None
    is_active: bool = True
    created_at: Timestamp = field(default_factory=Timestamp.now)
    updated_at: Optional[Timestamp] = None

    def activate(self) -> None:
        """激活模板"""
        self.is_active = True
        object.__setattr__(self, "updated_at", Timestamp.now())

    def deactivate(self) -> None:
        """停用模板"""
        self.is_active = False
        object.__setattr__(self, "updated_at", Timestamp.now())

    def update_config(self, config: Dict[str, Any]) -> None:
        """更新配置"""
        object.__setattr__(self, "config", config.copy())
        object.__setattr__(self, "updated_at", Timestamp.now())

    @property
    def is_valid(self) -> bool:
        """模板是否有效"""
        return (
            self.is_active
            and bool(self.name.strip())
            and bool(self.config)
        )


@dataclass
class Card:
    """卡片实体"""
    id: CardId
    user_id: UserId
    template_id: str
    content: ContentText
    style: CardStyle
    size: CardSize
    ai_model: AIModel
    design_spec: DesignSpec
    render_result: Optional[RenderResult] = None
    status: str = "draft"  # draft, generating, completed, failed
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: Timestamp = field(default_factory=Timestamp.now)
    updated_at: Optional[Timestamp] = None

    def start_generation(self) -> None:
        """开始生成"""
        self.status = "generating"
        object.__setattr__(self, "updated_at", Timestamp.now())

    def complete_generation(self, render_result: RenderResult) -> None:
        """完成生成"""
        if not render_result.success:
            self.status = "failed"
        else:
            self.status = "completed"
            object.__setattr__(self, "render_result", render_result)
        object.__setattr__(self, "updated_at", Timestamp.now())

    def fail_generation(self, error_message: str) -> None:
        """生成失败"""
        self.status = "failed"
        self.metadata["error_message"] = error_message
        object.__setattr__(self, "updated_at", Timestamp.now())

    def update_content(self, content: ContentText) -> None:
        """更新内容"""
        object.__setattr__(self, "content", content)
        object.__setattr__(self, "updated_at", Timestamp.now())
        # 如果内容更新，重置状态
        if self.status in ["completed", "failed"]:
            self.status = "draft"

    @property
    def is_generated(self) -> bool:
        """是否已生成"""
        return self.status == "completed"

    @property
    def is_failed(self) -> bool:
        """是否生成失败"""
        return self.status == "failed"

    @property
    def is_generating(self) -> bool:
        """是否正在生成"""
        return self.status == "generating"

    @property
    def can_generate(self) -> bool:
        """是否可以生成"""
        return self.status in ["draft", "failed"]


@dataclass
class GenerationTask:
    """生成任务实体"""
    id: UUID
    card_id: CardId
    user_id: UserId
    status: str = "pending"  # pending, processing, completed, failed, cancelled
    progress: float = 0.0
    result: Optional[RenderResult] = None
    error_message: Optional[str] = None
    started_at: Optional[Timestamp] = None
    completed_at: Optional[Timestamp] = None
    created_at: Timestamp = field(default_factory=Timestamp.now)

    def start(self) -> None:
        """开始任务"""
        self.status = "processing"
        self.progress = 0.0
        object.__setattr__(self, "started_at", Timestamp.now())

    def update_progress(self, progress: float) -> None:
        """更新进度"""
        self.progress = max(0.0, min(100.0, progress))
        object.__setattr__(self, "updated_at", Timestamp.now())

    def complete(self, result: RenderResult) -> None:
        """完成任务"""
        self.status = "completed" if result.success else "failed"
        self.progress = 100.0 if result.success else 0.0
        object.__setattr__(self, "result", result)
        if not result.success:
            self.error_message = result.error_message
        object.__setattr__(self, "completed_at", Timestamp.now())

    def cancel(self) -> None:
        """取消任务"""
        if self.status in ["pending", "processing"]:
            self.status = "cancelled"
            object.__setattr__(self, "completed_at", Timestamp.now())

    @property
    def is_pending(self) -> bool:
        """是否等待中"""
        return self.status == "pending"

    @property
    def is_processing(self) -> bool:
        """是否处理中"""
        return self.status == "processing"

    @property
    def is_completed(self) -> bool:
        """是否已完成"""
        return self.status == "completed"

    @property
    def is_failed(self) -> bool:
        """是否失败"""
        return self.status == "failed"

    @property
    def is_cancelled(self) -> bool:
        """是否已取消"""
        return self.status == "cancelled"

    @property
    def is_finished(self) -> bool:
        """是否已结束（完成/失败/取消）"""
        return self.status in ["completed", "failed", "cancelled"]


@dataclass
class User:
    """用户实体"""
    id: UserId
    username: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Dict[str, Any] = field(default_factory=dict)
    quota: Dict[str, int] = field(default_factory=dict)  # 配额信息
    is_active: bool = True
    created_at: Timestamp = field(default_factory=Timestamp.now)
    last_login_at: Optional[Timestamp] = None

    def update_preferences(self, preferences: Dict[str, Any]) -> None:
        """更新偏好设置"""
        self.preferences.update(preferences)

    def check_quota(self, operation: str, count: int = 1) -> bool:
        """检查配额"""
        current = self.quota.get(operation, 0)
        limit = self.preferences.get(f"{operation}_quota", 100)
        return current + count <= limit

    def consume_quota(self, operation: str, count: int = 1) -> None:
        """消耗配额"""
        if not self.check_quota(operation, count):
            raise DomainError(f"配额不足: {operation}")
        self.quota[operation] = self.quota.get(operation, 0) + count

    def record_login(self) -> None:
        """记录登录"""
        object.__setattr__(self, "last_login_at", Timestamp.now())

    @property
    def is_premium(self) -> bool:
        """是否为付费用户"""
        return self.preferences.get("plan") == "premium"

    @property
    def remaining_quota(self) -> Dict[str, int]:
        """剩余配额"""
        result = {}
        for operation, current in self.quota.items():
            limit = self.preferences.get(f"{operation}_quota", 100)
            result[operation] = max(0, limit - current)
        return result


# 聚合根
class CardAggregate:
    """卡片聚合根"""
    
    def __init__(self, card: Card) -> None:
        if not isinstance(card, Card):
            raise DomainError("card必须是Card实例")
        self._card = card

    @property
    def card(self) -> Card:
        """获取卡片"""
        return self._card

    def generate_card(self) -> GenerationTask:
        """生成卡片"""
        if not self._card.can_generate:
            raise DomainError("卡片当前状态不允许生成")

        self._card.start_generation()
        return GenerationTask(
            id=uuid4(),
            card_id=self._card.id,
            user_id=self._card.user_id,
        )

    def update_card_content(self, content: str) -> None:
        """更新卡片内容"""
        content_obj = ContentText(content)
        self._card.update_content(content_obj)


class TemplateLibrary:
    """模板库聚合根"""
    
    def __init__(self, templates: List[Template]) -> None:
        self._templates = {t.id: t for t in templates}
        self._active_templates = {t.id: t for t in templates if t.is_active}

    def get_template(self, template_id: str) -> Template:
        """获取模板"""
        template = self._templates.get(template_id)
        if template is None:
            raise TemplateNotFoundError(f"模板不存在: {template_id}")
        return template

    def get_active_templates(self, style: Optional[CardStyle] = None) -> List[Template]:
        """获取激活的模板"""
        templates = list(self._active_templates.values())
        if style:
            templates = [t for t in templates if t.style == style]
        return templates

    def add_template(self, template: Template) -> None:
        """添加模板"""
        if template.id in self._templates:
            raise DomainError(f"模板已存在: {template.id}")
        self._templates[template.id] = template
        if template.is_active:
            self._active_templates[template.id] = template

    def activate_template(self, template_id: str) -> None:
        """激活模板"""
        template = self.get_template(template_id)
        template.activate()
        self._active_templates[template_id] = template

    def deactivate_template(self, template_id: str) -> None:
        """停用模板"""
        template = self.get_template(template_id)
        template.deactivate()
        self._active_templates.pop(template_id, None)