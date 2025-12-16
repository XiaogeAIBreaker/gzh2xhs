from fastapi.testclient import TestClient
from pyapp.main import app

client = TestClient(app)

def test_export_zip_and_idempotency():
    body = {"items": [{"id": "card1", "svg": "<svg></svg>"}]}
    idem = "idem-123"
    r1 = client.post("/api/export", json=body, headers={"x-idempotency-key": idem})
    assert r1.status_code == 200
    assert r1.headers.get("ETag") is not None
    ct = r1.headers.get("Content-Type")
    assert ct == "application/zip"
    r2 = client.post("/api/export", json=body, headers={"x-idempotency-key": idem})
    assert r2.status_code == 200
    # 幂等命中缓存，ETag 一致
    assert r1.headers.get("ETag") == r2.headers.get("ETag")

