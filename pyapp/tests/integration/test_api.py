def test_health_check(client):
    response = client.get("/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "gzh2xhs-backend"}

def test_generate_endpoint(client, mock_ai_service):
    response = client.post(
        "/api/generate/",
        json={"text": "Test Article"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "svgContent" in data
    assert "designJson" in data
    assert data["svgContent"] == "<svg>test</svg>"
    
    # Verify mock called
    mock_ai_service.process.assert_called_once()

def test_export_endpoint(client, mock_renderer):
    response = client.post(
        "/api/export/png",
        content="<svg>test</svg>",
        headers={"Content-Type": "text/plain"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert response.content == b"fake-png-data"
