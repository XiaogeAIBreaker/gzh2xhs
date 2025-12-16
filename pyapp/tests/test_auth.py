from fastapi.testclient import TestClient
from pyapp.main import app

client = TestClient(app)

def test_register_and_login_me():
    r = client.post("/api/auth/register", json={"email": "user@example.com", "password": "secret"})
    assert r.status_code == 200
    r = client.post("/api/auth/login", json={"email": "user@example.com", "password": "secret"})
    assert r.status_code == 200
    token = r.json()["token"]
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["success"] is True

