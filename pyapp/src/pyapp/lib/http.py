import hashlib
from typing import Any, Dict, Optional
from fastapi.responses import JSONResponse, Response
import orjson

def _ensure_cache_headers(headers: Dict[str, str]) -> Dict[str, str]:
    if "Cache-Control" not in headers:
        headers["Cache-Control"] = "private, max-age=0, must-revalidate"
    return headers

def json_response(payload: Dict[str, Any], status_code: int = 200, etag: Optional[str] = None) -> JSONResponse:
    headers: Dict[str, str] = {}
    if etag:
        headers["ETag"] = etag
    headers = _ensure_cache_headers(headers)
    return JSONResponse(content=payload, status_code=status_code, headers=headers)

def compute_etag(data: Any) -> str:
    try:
        payload = orjson.dumps(data)
    except Exception:
        payload = repr(data).encode("utf-8")
    h = hashlib.sha256(payload).hexdigest()[:16]
    return f'W/"{h}"'

def binary_response_with_etag(buf: bytes, status_code: int = 200, headers: Optional[Dict[str, str]] = None) -> Response:
    headers = dict(headers or {})
    h = hashlib.sha256(buf).hexdigest()[:16]
    etag = f'W/"{h}"'
    headers["ETag"] = etag
    headers = _ensure_cache_headers(headers)
    return Response(content=buf, status_code=status_code, headers=headers, media_type="application/octet-stream")
