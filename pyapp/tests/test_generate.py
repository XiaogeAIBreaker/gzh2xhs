from fastapi.testclient import TestClient
from pyapp.main import app

client = TestClient(app)

def test_generate_success():
    resp = client.post("/api/generate", json={"text": "hello", "model": "m1", "style": "s"})
    assert resp.status_code == 200
    data = resp.json()
    assert "cards" in data and isinstance(data["cards"], list)
    assert "ETag" in resp.headers

def test_rate_limit():
    for _ in range(121):
        r = client.post("/api/generate", json={"text": "a", "model": "m", "style": "s"})
        if r.status_code == 429:
            break
    assert r.status_code == 429

