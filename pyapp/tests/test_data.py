from fastapi.testclient import TestClient
from pyapp.main import app

client = TestClient(app)

def test_data_list_and_delete():
    # 初次为空
    r = client.get("/api/data?type=item")
    assert r.status_code == 200
    assert isinstance(r.json().get("items"), list)
    # 插入一条再删除（通过仓库直接）
    from pyapp.infrastructure.data_repository import data_repo
    import asyncio
    asyncio.get_event_loop().run_until_complete(data_repo.create("item", {"name": "n"}))
    r = client.get("/api/data?type=item")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 1
    id_ = items[0]["id"]
    r = client.delete(f"/api/data?type=item&id={id_}")
    assert r.status_code == 200
    assert r.json()["success"] is True

