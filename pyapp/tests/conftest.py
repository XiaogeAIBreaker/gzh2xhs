import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock

from pyapp.main import app
from pyapp.services.ai.base import AIService
from pyapp.services.image.renderer import PlaywrightRenderer
from pyapp.api.dependencies import get_ai_service, get_image_renderer
from pyapp.domain.models import DesignJSON, Palette

@pytest.fixture
def mock_ai_service():
    service = AsyncMock(spec=AIService)
    service.provider_name = "MockAI"
    
    # Mock return value
    mock_design = DesignJSON(
        template_type="standard",
        palette=Palette(bg="#fff", text="#000", accent="#f00"),
        title_lines=["Test Title"],
    )
    service.process.return_value = ("<svg>test</svg>", mock_design)
    return service

@pytest.fixture
def mock_renderer():
    renderer = AsyncMock(spec=PlaywrightRenderer)
    renderer.render_svg_to_png.return_value = b"fake-png-data"
    return renderer

@pytest.fixture
def client(mock_ai_service, mock_renderer):
    app.dependency_overrides[get_ai_service] = lambda: mock_ai_service
    app.dependency_overrides[get_image_renderer] = lambda: mock_renderer
    
    with TestClient(app) as c:
        yield c
    
    app.dependency_overrides.clear()
