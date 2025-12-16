from fastapi import APIRouter
from ...lib.http import json_response

router = APIRouter()

@router.get("/logs")
async def get_logs():
    # 简化：返回空列表占位，前端可正常渲染
    return json_response({"items": []})

