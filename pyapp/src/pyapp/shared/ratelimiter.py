from typing import Dict
import time

class SlidingWindowLimiter:
    def __init__(self, limit_per_minute: int) -> None:
        self.limit = limit_per_minute
        self.window: Dict[str, list[float]] = {}

    def allow(self, key: str) -> bool:
        now = time.time()
        cutoff = now - 60
        arr = self.window.setdefault(key, [])
        while arr and arr[0] < cutoff:
            arr.pop(0)
        if len(arr) >= self.limit:
            return False
        arr.append(now)
        return True

limiter = SlidingWindowLimiter(limit_per_minute=120)

