from fastapi import APIRouter, Depends
from pyapp.modules.auth.deps import get_current_active_user
from pyapp.modules.auth.models import User

router = APIRouter()


@router.post("/")
async def export_data(
    data: dict,
    current_user: User = Depends(get_current_active_user)
):
    return {"status": "exported", "url": "https://example.com/export.zip"}
