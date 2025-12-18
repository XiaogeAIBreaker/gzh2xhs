"""Flatted Python 重构版包入口。

提供 `parse` 与 `stringify` 接口，保持与原始实现一致的功能与签名。
"""

from .api import parse, stringify

__all__ = ["parse", "stringify"]

