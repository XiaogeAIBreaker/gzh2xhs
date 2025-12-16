from __future__ import annotations
from typing import Dict, List

_histograms: Dict[str, List[float]] = {}

def observe(name: str, value: float) -> float:
    arr = _histograms.setdefault(name, [])
    arr.append(value)
    return value

def summary(name: str):
    arr = _histograms.get(name, [])
    if not arr:
        return {"count": 0}
    sorted_arr = sorted(arr)
    def p(q: float) -> float:
        idx = int((len(sorted_arr) - 1) * q)
        return sorted_arr[idx] if sorted_arr else 0.0
    avg = sum(sorted_arr) / len(sorted_arr)
    return {
        "count": len(sorted_arr),
        "avg": avg,
        "p50": p(0.5),
        "p90": p(0.9),
        "p95": p(0.95),
        "p99": p(0.99),
    }

