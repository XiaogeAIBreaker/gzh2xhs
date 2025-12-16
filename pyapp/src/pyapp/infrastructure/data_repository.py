from __future__ import annotations
from typing import Dict, Generic, TypeVar, Optional, List
import time
import secrets

T = TypeVar("T")

class DataRepository(Generic[T]):
    def __init__(self) -> None:
        self._store: Dict[str, Dict[str, T]] = {}

    def _bucket(self, type_: str) -> Dict[str, T]:
        k = type_.lower()
        if k not in self._store:
            self._store[k] = {}
        return self._store[k]

    async def create(self, type_: str, item: T) -> T:
        id_ = f"{int(time.time()*1000)}-{secrets.token_hex(6)}"
        full = dict(item)  # type: ignore
        full["id"] = id_
        self._bucket(type_)[id_] = full  # type: ignore
        return full  # type: ignore

    async def get(self, type_: str, id_: str) -> Optional[T]:
        return self._bucket(type_).get(id_)  # type: ignore

    async def delete(self, type_: str, id_: str) -> bool:
        return self._bucket(type_).pop(id_, None) is not None

    async def list(self, type_: str, q: str = "", page: int = 1, size: int = 20) -> List[T]:
        b = self._bucket(type_)
        arr = list(b.values())
        q = (q or "").lower()
        filtered = [it for it in arr if q in str(it).lower()] if q else arr
        page = max(1, page)
        size = max(1, min(100, size))
        start = (page - 1) * size
        return filtered[start : start + size]  # noqa: E203

data_repo: DataRepository[dict] = DataRepository()

