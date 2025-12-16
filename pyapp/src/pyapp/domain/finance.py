from __future__ import annotations
from dataclasses import dataclass
from typing import List, Literal, Dict, Any
import math

# 数据模型
@dataclass
class Bond:
    face_value: float
    coupon_rate: float
    coupon_freq_per_year: int
    currency: str

@dataclass
class DerivativeOption:
    strike: float
    type: Literal["call", "put"]
    currency: str

@dataclass
class Equity:
    currency: str

def _round(x: float) -> float:
    return float(f"{x:.8f}")

def price_bond(bond: Bond, yield_rate: float) -> Dict[str, Any]:
    fv = bond.face_value
    y = yield_rate
    n = bond.coupon_freq_per_year
    c = bond.coupon_rate
    coupon = fv * c / n
    pv_coupons = 0.0
    for k in range(1, n + 1):
        df = 1.0 / pow(1.0 + y / n, k)
        pv_coupons += coupon * df
    df_maturity = 1.0 / pow(1.0 + y / n, n)
    pv_face = fv * df_maturity
    price = pv_coupons + pv_face
    return {"price": _round(price), "currency": bond.currency}

def _cdf(x: float) -> float:
    # 标准正态分布 CDF
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

def price_option_bs(opt: DerivativeOption, spot: float, r: float, sigma: float, t_years: float) -> Dict[str, Any]:
    S = spot
    K = opt.strike
    R = r
    V = sigma
    T = t_years
    d1 = (math.log(S / K) + (R + (V * V) / 2.0) * T) / (V * math.sqrt(T))
    d2 = d1 - V * math.sqrt(T)
    Nd1 = _cdf(d1)
    Nd2 = _cdf(d2)
    disc = math.exp(-R * T)
    if opt.type == "call":
        price = S * Nd1 - K * Nd2 * disc
    else:
        price = K * disc * _cdf(-d2) - S * _cdf(-d1)
    return {"price": _round(price), "currency": opt.currency}

def equity_indicators(eq: Equity, series: List[float]) -> Dict[str, Any]:
    if not series:
        return {"avg": 0.0, "volatility": 0.0, "currency": eq.currency}
    n = len(series)
    avg = sum(series) / n
    var = sum([(x - avg) ** 2 for x in series]) / n
    vol = math.sqrt(var)
    return {"avg": _round(avg), "volatility": _round(vol), "currency": eq.currency}

