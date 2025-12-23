from fastapi import APIRouter, Depends
from pyapp.modules.auth.deps import get_current_active_user
from pyapp.modules.auth.models import User

router = APIRouter()


@router.get("/")
async def get_kpi(
    current_user: User = Depends(get_current_active_user)
):
    return {"kpi": {"dau": 1000, "mau": 5000}}
