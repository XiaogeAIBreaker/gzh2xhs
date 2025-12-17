from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from pyapp.lib.http import (
    extract_client_ip,
    get_client_ip,
    json_ok_with_etag,
    binary_ok_with_etag,
)


def test_extract_client_ip_priority():
    assert extract_client_ip("1.2.3.4, 5.6.7.8", None) == "1.2.3.4"
    assert extract_client_ip("  9.9.9.9  ", "1.1.1.1") == "9.9.9.9"
    assert extract_client_ip("", "2.2.2.2") == "2.2.2.2"
    assert extract_client_ip(None, None) is None


def test_get_client_ip_from_request():
    app = FastAPI()

    @app.get("/ip")
    async def ip(req: Request):
        return {"ip": get_client_ip(req)}

    c = TestClient(app)
    r = c.get("/ip", headers={"x-forwarded-for": "3.3.3.3, 4.4.4.4"})
    assert r.status_code == 200
    assert r.json()["ip"] == "3.3.3.3"
    r2 = c.get("/ip", headers={"x-real-ip": "7.7.7.7"})
    assert r2.json()["ip"] == "7.7.7.7"


def test_json_ok_with_etag_and_304():
    app = FastAPI()

    payload = {"hello": "world"}

    @app.get("/data")
    async def data(req: Request):
        return json_ok_with_etag(req, payload)

    c = TestClient(app)
    r1 = c.get("/data")
    assert r1.status_code == 200
    etag = r1.headers.get("ETag")
    assert etag and etag.startswith('W/"')
    r2 = c.get("/data", headers={"If-None-Match": etag})
    assert r2.status_code == 304
    # Cache-Control should be present in both cases
    assert r2.headers.get("Cache-Control") == "private, max-age=0, must-revalidate"


def test_binary_ok_with_etag_and_304():
    app = FastAPI()
    buf = b"abcdefg"

    @app.get("/bin")
    async def bin(req: Request):
        return binary_ok_with_etag(req, buf, media_type="application/octet-stream")

    c = TestClient(app)
    r1 = c.get("/bin")
    assert r1.status_code == 200
    etag = r1.headers.get("ETag")
    assert etag and etag.startswith('W/"')
    r2 = c.get("/bin", headers={"If-None-Match": etag})
    assert r2.status_code == 304
    assert r2.headers.get("Cache-Control") == "private, max-age=0, must-revalidate"
