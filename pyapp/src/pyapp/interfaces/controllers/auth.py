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
    user = await user_repo.verify(input.email, input.password)
    if not user:
        _json_error("BAD_REQUEST", "邮箱或密码错误", 400)
    token = "admin-token" if user.role == "admin" else "user-token"
    return json_response({"success": True, "token": token, "user": {"id": user.id, "email": user.email, "role": user.role}})

@router.post("/auth/register")
async def register(input: RegisterInput, _req: Request):
    exists = await user_repo.find_by_email(input.email)
    if exists:
        _json_error("BAD_REQUEST", "邮箱已存在", 400)
    user = await user_repo.create(input.email, input.password)
    return json_response({"success": True, "user": {"id": user.id, "email": user.email, "role": user.role}})

@router.get("/auth/me")
async def me(req: Request):
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
