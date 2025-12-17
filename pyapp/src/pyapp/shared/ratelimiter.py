"""滑动窗口速率限制器。

支持内存与 Redis 双实现：优先使用 Redis 以便多实例共享限流状态，故障时回退到内存。
"""

from typing import Dict, List
import time

try:
    import redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None  # type: ignore

class SlidingWindowLimiter:
    def __init__(self, limit_per_minute: int) -> None:
        """初始化限流器。

        参数：
            limit_per_minute: 每分钟允许的请求次数。
        """
        self.limit = limit_per_minute
        self.window: Dict[str, List[float]] = {}
        self._redis = None
        if redis is not None:
            try:
                self._redis = redis.Redis(host="localhost", port=6379, db=0)
                # ping
                self._redis.ping()
            except Exception:
                self._redis = None

    def _allow_memory(self, key: str) -> bool:
        """内存实现：维护每键的时间戳列表并判断窗口内计数。"""
        now = time.time()
        cutoff = now - 60
        arr = self.window.setdefault(key, [])
        while arr and arr[0] < cutoff:
            arr.pop(0)
        if len(arr) >= self.limit:
            return False
        arr.append(now)
        return True

    def _allow_redis(self, key: str) -> bool:
        """Redis 实现：使用分钟粒度的计数键并设置过期。"""
        if not self._redis:
            return self._allow_memory(key)
        try:
            now_ms = int(time.time() * 1000)
            window_ms = 60_000
            window_start = now_ms // window_ms * window_ms
            rk = f"rl:{key}:{window_start}"
            p = self._redis.pipeline()
            p.incr(rk)
            p.pexpire(rk, window_ms)
            count = p.execute()[0]
            count_int = int(count)
            return count_int <= self.limit
        except Exception:
            return self._allow_memory(key)

    def allow(self, key: str) -> bool:
        """判断给定键是否允许通过限流。"""
        return self._allow_redis(key)
from ..config.settings import settings

limiter = SlidingWindowLimiter(limit_per_minute=settings.rate_limit_per_minute)
