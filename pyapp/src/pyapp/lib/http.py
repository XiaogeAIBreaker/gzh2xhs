import hashlib
from typing import Any, Dict, Optional
from fastapi.responses import JSONResponse

def json_response(payload: Dict[str, Any], status_code: int = 200, etag: Optional[str] = None) -> JSONResponse:
    headers: Dict[str, str] = {}
    if etag:
        headers["ETag"] = etag
    return JSONResponse(content=payload, status_code=status_code, headers=headers)

def compute_etag(data: Any) -> str:
    s = repr(data).encode("utf-8")
    return hashlib.sha256(s).hexdigest()

