from __future__ import annotations
from typing import Optional, Dict, Tuple
import hashlib
import time
import secrets

class UserDto:
    def __init__(self, id: str, email: str, role: str = "user") -> None:
        self.id = id
        self.email = email
        self.role = role

class UserRepository:
    def __init__(self) -> None:
        self._users: Dict[str, Tuple[UserDto, str]] = {}

    def _hash(self, pw: str) -> str:
        return hashlib.sha256(pw.encode("utf-8")).hexdigest()

    async def create(self, email: str, password: str, role: str = "user") -> UserDto:
        uid = f"{int(time.time()*1000)}-{secrets.token_hex(6)}"
        user = UserDto(id=uid, email=email, role=role)
        self._users[email.lower()] = (user, self._hash(password))
        return user

    async def find_by_email(self, email: str) -> Optional[UserDto]:
        rec = self._users.get(email.lower())
        return rec[0] if rec else None

    async def verify(self, email: str, password: str) -> Optional[UserDto]:
        rec = self._users.get(email.lower())
        if not rec:
            return None
        return rec[0] if rec[1] == self._hash(password) else None

user_repo = UserRepository()
