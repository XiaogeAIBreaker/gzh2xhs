from pyapp.modules.finance.schemas import (
    PricingRequest, PricingResponse,
    ReportRequest, ReportResponse,
    RiskRequest, RiskResponse
)


class FinanceService:
    async def get_pricing(self, request: PricingRequest) -> PricingResponse:
        # Mock logic
        return PricingResponse(price=100.0, currency=request.currency)

    async def create_report(self, request: ReportRequest) -> ReportResponse:
        # Mock logic
        return ReportResponse(report_id="r12345", status="processing")

    async def check_risk(self, request: RiskRequest) -> RiskResponse:
        # Mock logic
        score = 0.1
        return RiskResponse(
            score=score,
            risk_level="low",
            allowed=True
        )

finance_service = FinanceService()
