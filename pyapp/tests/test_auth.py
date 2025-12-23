import pytest
from httpx import AsyncClient

from pyapp.core.config import settings

@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    # Register
    register_data = {
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    }
    response = await client.post(f"{settings.API_PREFIX}/auth/register", json=register_data)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == register_data["email"]
    assert "id" in data
    assert "hashed_password" not in data

    # Login
    login_data = {
        "username": "test@example.com",
        "password": "password123"
    }
    response = await client.post(f"{settings.API_PREFIX}/auth/login", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
