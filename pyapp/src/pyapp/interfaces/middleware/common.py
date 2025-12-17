"""通用中间件与异常处理。

- 请求 ID：为每个请求注入 `X-Request-Id`，便于链路追踪。
- CORS：在开发与跨域场景下放开源、方法与头部限制。
- 统一异常：对 `HTTPException` 与未知错误统一返回 JSON 错误结构，保持接口契约一致。
"""

import uuid
from typing import Any, Dict
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ...config.settings import settings
from ...lib.logger import log

async def request_id_middleware(request: Request, call_next):
    """注入请求 ID 并记录基本访问日志。"""
    rid = request.headers.get("X-Request-Id") or str(uuid.uuid4())
    start = uuid.uuid4().hex
    response = await call_next(request)
    response.headers["X-Request-Id"] = rid
    log.info("request", request_id=rid, path=str(request.url), method=request.method)
    return response

def add_common_middleware(app: FastAPI) -> None:
    """注册通用中间件：请求 ID 与 CORS。"""
    app.middleware("http")(request_id_middleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def add_exception_handlers(app: FastAPI) -> None:
    """注册统一异常处理器（HTTP/通用异常）。"""

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> Response:  # type: ignore[override]
        rid = request.headers.get("X-Request-Id") or str(uuid.uuid4())
        # Preserve 304 semantics (no body) while ensuring headers can be set upstream
        if exc.status_code == 304:
            resp = Response(status_code=304)
            resp.headers["X-Request-Id"] = rid
            return resp
        payload: Dict[str, Any] = {
            "code": exc.status_code,
            "message": exc.detail if isinstance(exc.detail, str) else "HTTP error",
            "request_id": rid,
        }
        return JSONResponse(status_code=exc.status_code, content=payload)

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:  # type: ignore[override]
        rid = request.headers.get("X-Request-Id") or str(uuid.uuid4())
        log.error("unhandled", request_id=rid, error=str(exc))
        payload = {"code": 500, "message": "Internal Server Error", "request_id": rid}
        return JSONResponse(status_code=500, content=payload)
