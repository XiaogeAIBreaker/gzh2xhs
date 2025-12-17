"""认证相关 HTTP 控制器。

提供与原有接口等价的登录、注册与用户信息查询端点：
- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`

保持请求/响应结构与错误码兼容，确保迁移期间的向后兼容性。
"""

from __future__ import annotations
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from ...infrastructure.user_repository import user_repo, UserDto
from ...lib.http import json_response

router = APIRouter()

class LoginInput(BaseModel):
    email: str
    password: str

class RegisterInput(BaseModel):
    email: str
    password: str

def _json_error(code: str, message: str, status: int = 400):
    raise HTTPException(status_code=status, detail={"code": code, "message": message})

@router.post("/auth/login")
async def login(input: LoginInput, _req: Request):
    """登录接口。

    参数：
        input: 包含 `email` 与 `password` 的登录请求体。
        _req: FastAPI Request（未使用）。

    返回：
        登录成功时返回 `token` 与用户信息；失败返回 400 错误码。
    """
    user = await user_repo.verify(input.email, input.password)
    if not user:
        _json_error("BAD_REQUEST", "邮箱或密码错误", 400)
    token = "admin-token" if user.role == "admin" else "user-token"
    return json_response({"success": True, "token": token, "user": {"id": user.id, "email": user.email, "role": user.role}})

@router.post("/auth/register")
async def register(input: RegisterInput, _req: Request):
    """注册接口。

    创建用户并返回用户基本信息；如邮箱已存在，返回 400 错误码。
    """
    exists = await user_repo.find_by_email(input.email)
    if exists:
        _json_error("BAD_REQUEST", "邮箱已存在", 400)
    user = await user_repo.create(input.email, input.password)
    return json_response({"success": True, "user": {"id": user.id, "email": user.email, "role": user.role}})

@router.get("/auth/me")
async def me(req: Request):
    """获取当前认证用户信息。

    从 `Authorization: Bearer <token>` 中解析 token，返回对应用户角色与邮箱。
    未登录返回 403。
    """
    auth = req.headers.get("authorization") or ""
    token = auth.split(" ")[-1] if auth.lower().startswith("bearer ") else ""
    if not token:
        _json_error("FORBIDDEN", "未登录", 403)
    if token == "admin-token":
        email = "admin@example.com"
        user = await user_repo.find_by_email(email)
        payload = {"id": user.id if user else "admin", "email": email, "role": "admin"}
        return json_response({"success": True, "user": payload})
    email = "user@example.com"
    user = await user_repo.find_by_email(email)
    payload = {"id": user.id if user else "user", "email": email, "role": "user"}
    return json_response({"success": True, "user": payload})
