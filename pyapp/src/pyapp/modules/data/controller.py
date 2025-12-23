from fastapi import APIRouter, Depends
from pyapp.modules.auth.deps import get_current_active_user
from pyapp.modules.auth.models import User

router = APIRouter()


@router.get("/")
async def get_data(
    current_user: User = Depends(get_current_active_user)
):
    return {"data": "Secure Data"}
