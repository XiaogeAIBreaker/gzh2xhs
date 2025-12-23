"""
重构版公众号转小红书卡片生成器 - Python项目

这个包提供了将微信公众号文章转换为小红书风格卡片的完整解决方案。
遵循企业级开发标准，包括完整的类型注解、异常处理、日志记录等。

主要模块:
- application: 应用层用例
- domain: 领域模型
- infrastructure: 基础设施
- interfaces: 接口层
- shared: 共享组件
"""

__version__ = "1.0.0"
__author__ = "重构团队"
__email__ = "refactor@gzh2xhs.com"
__license__ = "MIT"

# 导出主要组件
from gzh2xhs_refactor.application.use_cases import (
    GenerateCardUseCase,
    ExportCardUseCase,
)
from gzh2xhs_refactor.domain.services import (
    AIService,
    ImageRenderService,
    CacheService,
)
from gzh2xhs_refactor.infrastructure.providers import (
    DeepSeekProvider,
    NanoBananaProvider,
    PlaywrightRenderer,
)

__all__ = [
    "GenerateCardUseCase",
    "ExportCardUseCase",
    "AIService",
    "ImageRenderService",
    "CacheService",
    "DeepSeekProvider",
    "NanoBananaProvider",
    "PlaywrightRenderer",
]