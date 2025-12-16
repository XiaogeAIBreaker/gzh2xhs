from fastapi.testclient import TestClient
from pyapp.main import app

client = TestClient(app)

def test_pricing_bond():
    body = {
        "faceValue": 1000,
        "couponRate": 0.05,
        "couponFreqPerYear": 2,
        "currency": "USD",
        "yieldRate": 0.04,
    }
    r = client.post("/api/finance/pricing", json=body)
    assert r.status_code == 200
    js = r.json()
    assert "price" in js and "currency" in js

def test_risk_option():
    body = {"strike": 100, "type": "call", "currency": "USD", "spot": 105, "r": 0.01, "sigma": 0.2, "tYears": 0.5}
    r = client.post("/api/finance/risk", json=body)
    assert r.status_code == 200
    js = r.json()
    assert "price" in js and js["currency"] == "USD"

def test_report_equity():
    body = {"currency": "USD", "series": [1,2,3,4,5]}
    r = client.post("/api/finance/report", json=body)
    assert r.status_code == 200
    js = r.json()
    assert "avg" in js and "volatility" in js

