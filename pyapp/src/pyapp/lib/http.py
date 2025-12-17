import hashlib
from typing import Any, Dict, Optional
from fastapi import Request
from fastapi.responses import JSONResponse, Response
import orjson

def _ensure_cache_headers(headers: Dict[str, str]) -> Dict[str, str]:
    """Ensure standard cache headers are present.

    Adds `Cache-Control: private, max-age=0, must-revalidate` if missing.

    Args:
        headers: Existing headers mapping.

    Returns:
        Updated headers mapping with cache directives.
    """
    if "Cache-Control" not in headers:
        headers["Cache-Control"] = "private, max-age=0, must-revalidate"
    return headers

def json_response(payload: Dict[str, Any], status_code: int = 200, etag: Optional[str] = None) -> JSONResponse:
    """Return a JSON response with optional weak ETag and cache headers.

    Args:
        payload: JSON-serializable content.
        status_code: HTTP status code.
        etag: Optional ETag to include.

    Returns:
        FastAPI JSONResponse with proper headers.
    """
    headers: Dict[str, str] = {}
    if etag:
        headers["ETag"] = etag
    headers = _ensure_cache_headers(headers)
    return JSONResponse(content=payload, status_code=status_code, headers=headers)

def compute_etag(data: Any) -> str:
    """Compute a weak ETag for arbitrary JSON-serializable data.

    Uses SHA-256 of the serialized payload and takes the first 16 hex chars,
    prefixed with `W/` to denote weakness.

    Args:
        data: Arbitrary data to hash.

    Returns:
        Weak ETag string, e.g. `W/"deadbeefcafebabe"`.
    """
    try:
        payload = orjson.dumps(data)
    except Exception:
        payload = repr(data).encode("utf-8")
    h = hashlib.sha256(payload).hexdigest()[:16]
    return f'W/"{h}"'

def binary_response_with_etag(buf: bytes, status_code: int = 200, headers: Optional[Dict[str, str]] = None) -> Response:
    """Return a binary response with weak ETag and cache headers.

    Args:
        buf: Binary payload.
        status_code: HTTP status.
        headers: Optional extra headers.

    Returns:
        FastAPI Response with binary content and weak ETag.
    """
    headers = dict(headers or {})
    h = hashlib.sha256(buf).hexdigest()[:16]
    etag = f'W/"{h}"'
    headers["ETag"] = etag
    headers = _ensure_cache_headers(headers)
    return Response(content=buf, status_code=status_code, headers=headers, media_type="application/octet-stream")


def extract_client_ip(x_forwarded_for: Optional[str], x_real_ip: Optional[str]) -> Optional[str]:
    """Extract the client IP from `x-forwarded-for` or `x-real-ip` headers.

    Strategy:
    - Prefer the left-most IP in `x-forwarded-for` (split by comma).
    - Fallback to `x-real-ip` if `x-forwarded-for` is missing/empty.

    Args:
        x_forwarded_for: Raw `x-forwarded-for` header value.
        x_real_ip: Raw `x-real-ip` header value.

    Returns:
        The best-effort client IP string or None.
    """
    if x_forwarded_for:
        parts = [p.strip() for p in x_forwarded_for.split(",") if p.strip()]
        if parts:
            return parts[0]
    return x_real_ip or None


def get_client_ip(request: Request) -> Optional[str]:
    """Convenience wrapper to extract client IP from a FastAPI Request.

    Args:
        request: Incoming FastAPI Request.

    Returns:
        Client IP or None.
    """
    xf = request.headers.get("x-forwarded-for")
    xr = request.headers.get("x-real-ip")
    return extract_client_ip(xf, xr)


def json_ok_with_etag(request: Request, payload: Dict[str, Any]) -> Response:
    """Return JSON 200 or 304 when If-None-Match equals computed weak ETag.

    Args:
        request: FastAPI Request used to read `If-None-Match`.
        payload: JSON-serializable content.

    Returns:
        JSONResponse with 200 and ETag or 304 when matched.
    """
    etag = compute_etag(payload)
    inm = request.headers.get("if-none-match")
    if inm and inm == etag:
        headers = _ensure_cache_headers({"ETag": etag})
        return Response(status_code=304, headers=headers)
    return json_response(payload, status_code=200, etag=etag)


def binary_ok_with_etag(request: Request, buf: bytes, media_type: str = "application/octet-stream") -> Response:
    """Return binary 200 or 304 when If-None-Match equals computed weak ETag.

    Args:
        request: FastAPI Request used to read `If-None-Match`.
        buf: Binary payload.
        media_type: Content type for the response.

    Returns:
        Response with 200 and ETag or 304 when matched.
    """
    h = hashlib.sha256(buf).hexdigest()[:16]
    etag = f'W/"{h}"'
    inm = request.headers.get("if-none-match")
    if inm and inm == etag:
        headers = _ensure_cache_headers({"ETag": etag})
        return Response(status_code=304, headers=headers, media_type=media_type)
    headers = _ensure_cache_headers({"ETag": etag})
    return Response(content=buf, status_code=200, headers=headers, media_type=media_type)
