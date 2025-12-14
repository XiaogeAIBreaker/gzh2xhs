import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from ...config.settings import settings
from ...lib.logger import log

async def request_id_middleware(request: Request, call_next):
    rid = request.headers.get("X-Request-Id") or str(uuid.uuid4())
    start = uuid.uuid4().hex
    response = await call_next(request)
    response.headers["X-Request-Id"] = rid
    log.info("request", request_id=rid, path=str(request.url), method=request.method)
    return response

def add_common_middleware(app: FastAPI) -> None:
    app.middleware("http")(request_id_middleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
