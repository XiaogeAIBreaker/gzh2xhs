"""轻量级基于内存的 LRU 缓存实现。

提供带 TTL 的键值缓存，支持容量控制与最近使用更新，满足接口层去重与热点响应加速。
"""

from typing import Any, Dict, Optional
import time

class CacheEntry:
    """缓存条目，包含值与过期时间。"""

    def __init__(self, value: Any, ttl_seconds: int) -> None:
        self.value = value
        self.expires_at = time.time() + ttl_seconds

class LRUCache:
    """简易 LRU 缓存。

    参数：
        capacity: 最大保留键数。
        default_ttl_seconds: 默认过期秒数。
    """

    def __init__(self, capacity: int = 512, default_ttl_seconds: int = 60) -> None:
        self._store: Dict[str, CacheEntry] = {}
        from typing import List
        self._order: List[str] = []
        self._capacity = max(1, capacity)
        self._default_ttl = max(1, default_ttl_seconds)

    def _touch(self, key: str) -> None:
        try:
            self._order.remove(key)
        except ValueError:
            pass
        self._order.append(key)

    def _evict_if_needed(self) -> None:
        while len(self._order) > self._capacity:
            oldest = self._order.pop(0)
            self._store.pop(oldest, None)

    def get(self, key: str) -> Optional[Any]:
        """获取键的缓存值，过期则返回 `None` 并清理。"""
        entry = self._store.get(key)
        if not entry:
            return None
        if entry.expires_at < time.time():
            self._store.pop(key, None)
            try:
                self._order.remove(key)
            except ValueError:
                pass
            return None
        self._touch(key)
        return entry.value

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        """写入键值并更新最近使用顺序，必要时执行淘汰。"""
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        self._store[key] = CacheEntry(value, ttl)
        self._touch(key)
        self._evict_if_needed()

    def delete(self, key: str) -> None:
        """删除指定键的缓存记录。"""
        self._store.pop(key, None)
        try:
            self._order.remove(key)
        except ValueError:
            pass

cache = LRUCache()
