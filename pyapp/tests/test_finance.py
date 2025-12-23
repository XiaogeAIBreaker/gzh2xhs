import pytest
from httpx import AsyncClient

from pyapp.core.config import settings

@pytest.mark.asyncio
async def test_finance_pricing(client: AsyncClient):
    # Register & Login to get token
    await client.post(f"{settings.API_PREFIX}/auth/register", json={
        "email": "finance@example.com",
        "password": "pass",
        "full_name": "Finance User"
    })
    login_res = await client.post(f"{settings.API_PREFIX}/auth/login", data={
        "username": "finance@example.com",
        "password": "pass"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test Pricing
    response = await client.post(
        f"{settings.API_PREFIX}/finance/pricing", 
        json={"product_id": "p1", "currency": "USD"},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["price"] == 100.0
