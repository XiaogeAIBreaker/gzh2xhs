from fastapi.testclient import TestClient
from pyapp.main import app

client = TestClient(app)

def test_generate_etag_style():
    r = client.post("/api/generate", json={"text": "hello", "model": "m", "style": "s"})
    assert r.status_code == 200
    etag = r.headers.get("ETag")
    assert etag is not None
    assert etag.startswith('W/"') and len(etag) >= 6
    # 命中 If-None-Match
    r2 = client.post("/api/generate", json={"text": "hello", "model": "m", "style": "s"}, headers={"If-None-Match": etag})
    assert r2.status_code == 304

