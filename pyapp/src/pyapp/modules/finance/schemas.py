from typing import List, Optional
from pydantic import BaseModel


class PricingRequest(BaseModel):
    product_id: str
    currency: str = "USD"


class PricingResponse(BaseModel):
    price: float
    currency: str


class ReportRequest(BaseModel):
    date_range: List[str]
    type: str


class ReportResponse(BaseModel):
    report_id: str
    status: str
    url: Optional[str] = None


class RiskRequest(BaseModel):
    transaction_id: str
    amount: float


class RiskResponse(BaseModel):
    score: float
    risk_level: str
    allowed: bool
