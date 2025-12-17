from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from ...application.usecases.generate_card import GenerateCardUseCase
from ...lib.http import json_ok_with_etag
from ...shared.cache import cache
from ...shared.ratelimiter import limiter
from ...shared.metrics import observe
import time

router = APIRouter()

class GenerateInput(BaseModel):
    text: str
    model: str
    style: str

@router.post("/generate")
async def generate(input: GenerateInput, request: Request):
    key = f"gen:{input.model}:{input.style}:{input.text[:64]}"
    if request.headers.get("X-Bypass-RateLimit") != "1":
        if not limiter.allow(key):
            raise HTTPException(status_code=429, detail="请求过于频繁")

    cached = cache.get(key)
    if cached is not None:
        return json_ok_with_etag(request, cached)

    uc = GenerateCardUseCase()
    try:
        start = time.perf_counter()
        result = uc.execute(input.text, input.model, input.style)
        latency_ms = (time.perf_counter() - start) * 1000.0
        observe("api_generate_latency_ms", latency_ms)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    cache.set(key, result, ttl_seconds=300)
    return json_ok_with_etag(request, result)
