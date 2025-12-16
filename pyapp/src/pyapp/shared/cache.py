from typing import Any, Dict, Optional
import time

class CacheEntry:
    def __init__(self, value: Any, ttl_seconds: int) -> None:
        self.value = value
        self.expires_at = time.time() + ttl_seconds

class LRUCache:
    def __init__(self, capacity: int = 512, default_ttl_seconds: int = 60) -> None:
        self._store: Dict[str, CacheEntry] = {}
        self._order: list[str] = []
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
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        self._store[key] = CacheEntry(value, ttl)
        self._touch(key)
        self._evict_if_needed()

    def delete(self, key: str) -> None:
        self._store.pop(key, None)
        try:
            self._order.remove(key)
        except ValueError:
            pass

cache = LRUCache()
