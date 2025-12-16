from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("/openapi")
async def get_openapi(req: Request):
    return JSONResponse(req.app.openapi())
