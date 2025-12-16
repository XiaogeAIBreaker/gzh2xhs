from __future__ import annotations
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import List
import io
import zipfile
from ...shared.ratelimiter import limiter
from ...shared.cache import cache
from ...shared.image_converter import convert_svg_to_png
from ...lib.http import binary_response_with_etag

router = APIRouter()

class ExportItem(BaseModel):
    id: str
    svg: str

class ExportRequest(BaseModel):
    items: List[ExportItem]

@router.post("/export")
async def export_zip(req: Request, body: ExportRequest):
    ip = (req.headers.get("x-forwarded-for") or "").split(",")[0] or "0.0.0.0"
    key = f"export:{ip}"
    if not limiter.allow(key):
        raise HTTPException(status_code=429, detail={"code": "RATE_LIMITED", "message": "访问过于频繁"})
    idem = req.headers.get("x-idempotency-key")
    if idem:
        cached = cache.get(f"export:{idem}")
        if cached is not None:
            return binary_response_with_etag(
                cached,
                200,
                {
                    "Content-Type": "application/zip",
                    "Content-Disposition": f'attachment; filename="xiaohongshu-cards-{int(io.BytesIO().tell())}.zip"',
                },
            )

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for item in body.items:
            png_bytes, _ = await convert_svg_to_png(item.svg)
            zf.writestr(f"{item.id}.png", png_bytes)
    data = buf.getvalue()
    if idem:
        cache.set(f"export:{idem}", data, ttl_seconds=300)
    return binary_response_with_etag(
        data,
        200,
        {
            "Content-Type": "application/zip",
            "Content-Disposition": f'attachment; filename="xiaohongshu-cards-{int(io.BytesIO().tell())}.zip"',
        },
    )

