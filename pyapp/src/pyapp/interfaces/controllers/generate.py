from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from ...application.usecases.generate_card import GenerateCardUseCase
from ...lib.http import json_response, compute_etag
from ...shared.cache import cache
from ...shared.ratelimiter import limiter

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
        etag = compute_etag(cached)
        inm = request.headers.get("If-None-Match")
        if inm == etag:
            raise HTTPException(status_code=304, detail="Not Modified")
        return json_response(cached, status_code=200, etag=etag)

    uc = GenerateCardUseCase()
    try:
        result = uc.execute(input.text, input.model, input.style)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    cache.set(key, result, ttl_seconds=300)
    etag = compute_etag(result)
    return json_response(result, status_code=200, etag=etag)
