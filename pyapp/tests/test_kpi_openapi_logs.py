from fastapi.testclient import TestClient
from pyapp.main import app

client = TestClient(app)

def test_kpi():
    r = client.get("/api/kpi")
    assert r.status_code == 200
    assert "latency" in r.json()

def test_openapi():
    r = client.get("/api/openapi")
    assert r.status_code == 200
    assert isinstance(r.json(), dict)

def test_logs():
    r = client.get("/api/logs")
    assert r.status_code == 200
    assert "items" in r.json()

