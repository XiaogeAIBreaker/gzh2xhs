from fastapi import APIRouter, Depends, HTTPException

from pyapp.modules.auth.deps import get_current_active_user
from pyapp.modules.auth.models import User
from pyapp.modules.generate import schemas
from pyapp.modules.generate.service import generate_service

router = APIRouter()


@router.post("/", response_model=schemas.GenerateResponse)
async def generate_card(
    request: schemas.GenerateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate a Xiaohongshu card from text.
    """
    try:
        return await generate_service.generate_card(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
