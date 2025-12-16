from fastapi import APIRouter
from ...shared.metrics import summary
from ...lib.http import json_response

router = APIRouter()

@router.get("/kpi")
async def get_kpi():
    generate = summary("api_generate_latency_ms")
    return json_response({"latency": generate})

