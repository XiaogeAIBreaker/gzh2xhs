from fastapi import APIRouter, Depends

from pyapp.modules.auth.deps import get_current_active_user
from pyapp.modules.auth.models import User
from pyapp.modules.finance import schemas
from pyapp.modules.finance.service import finance_service

router = APIRouter()


@router.post("/pricing", response_model=schemas.PricingResponse)
async def get_pricing(
    request: schemas.PricingRequest,
    current_user: User = Depends(get_current_active_user)
):
    return await finance_service.get_pricing(request)


@router.post("/report", response_model=schemas.ReportResponse)
async def create_report(
    request: schemas.ReportRequest,
    current_user: User = Depends(get_current_active_user)
):
    return await finance_service.create_report(request)


@router.post("/risk", response_model=schemas.RiskResponse)
async def check_risk(
    request: schemas.RiskRequest,
    current_user: User = Depends(get_current_active_user)
):
    return await finance_service.check_risk(request)
