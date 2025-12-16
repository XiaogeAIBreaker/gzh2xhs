from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional
from ...infrastructure.data_repository import data_repo
from ...lib.http import json_response

router = APIRouter()

class ListQuery(BaseModel):
    type: str
    q: Optional[str] = None
    page: Optional[int] = 1
    size: Optional[int] = 20

@router.get("/data")
async def list_data(req: Request):
    # 简化：从查询字符串读取
    params = req.query_params
    type_ = params.get("type") or "default"
    q = params.get("q") or ""
    page = int(params.get("page") or 1)
    size = int(params.get("size") or 20)
    items = await data_repo.list(type_, q, page, size)
    return json_response({"items": items})

@router.delete("/data")
async def delete_data(req: Request):
    params = req.query_params
    type_ = params.get("type") or "default"
    id_ = params.get("id") or ""
    ok = await data_repo.delete(type_, id_)
    return json_response({"success": ok})

