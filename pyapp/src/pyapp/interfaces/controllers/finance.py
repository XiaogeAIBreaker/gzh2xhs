from __future__ import annotations
from fastapi import APIRouter, Request
from typing import List
from pydantic import BaseModel, Field
from ...domain.finance import (
    Bond,
    DerivativeOption,
    Equity,
    price_bond,
    price_option_bs,
    equity_indicators,
)
from ...lib.http import json_response

router = APIRouter()

class BondInput(BaseModel):
    faceValue: float = Field(alias="faceValue")
    couponRate: float
    couponFreqPerYear: int
    currency: str
    yieldRate: float

@router.post("/finance/pricing")
async def pricing_bond(input: BondInput, _req: Request):
    bond = Bond(
        face_value=input.faceValue,
        coupon_rate=input.couponRate,
        coupon_freq_per_year=input.couponFreqPerYear,
        currency=input.currency,
    )
    res = price_bond(bond, input.yieldRate)
    return json_response(res)

class OptionInput(BaseModel):
    strike: float
    type: str
    currency: str
    spot: float
    r: float
    sigma: float
    tYears: float = Field(alias="tYears")

@router.post("/finance/risk")
async def risk_option(input: OptionInput, _req: Request):
    opt = DerivativeOption(strike=input.strike, type=input.type, currency=input.currency)
    res = price_option_bs(opt, input.spot, input.r, input.sigma, input.tYears)
    return json_response(res)

class EquityInput(BaseModel):
    """Equity report input payload.

    Attributes:
        currency: Currency code string.
        series: Price/return series for indicators calculation.
    """
    currency: str
    series: List[float]

@router.post("/finance/report")
async def report_equity(input: EquityInput, _req: Request):
    eq = Equity(currency=input.currency)
    res = equity_indicators(eq, input.series)
    return json_response(res)
