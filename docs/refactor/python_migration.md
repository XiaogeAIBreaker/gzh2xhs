# Refactoring to Python: Architecture & Migration Guide

## Overview

This document details the refactoring of the GZH2XHS backend from Node.js (NestJS/Next.js) to Python (FastAPI). The new backend is located in the `pyapp/` directory.

## Architecture

### Clean Architecture

The application follows a clean, layered architecture:

- **API Layer** (`src/pyapp/api/`): Handles HTTP requests, dependency injection, and response formatting.
- **Service Layer** (`src/pyapp/services/`): Contains business logic (AI interaction, Image generation).
- **Domain Layer** (`src/pyapp/domain/`): Defines data models (Pydantic schemas) and interfaces.
- **Core Layer** (`src/pyapp/core/`): Infrastructure code (Config, Logging, Exceptions).

### Key Components

1.  **FastAPI**: Chosen for its high performance (async support) and automatic OpenAPI documentation.
2.  **Pydantic V2**: Used for strict type validation of Design JSON and API requests.
3.  **Playwright Python**: Ensures 100% compatibility with the original emoji rendering logic by using a headless Chromium browser.
4.  **HTTPX**: Async HTTP client for communicating with DeepSeek and NanoBanana APIs.

## Migration Status

| Feature             | Status    | Python Implementation  |
| :------------------ | :-------- | :--------------------- |
| **Generation API**  | ✅ Ready  | `POST /api/generate`   |
| **Export API**      | ✅ Ready  | `POST /api/export/png` |
| **AI (DeepSeek)**   | ✅ Ready  | `DeepSeekService`      |
| **AI (NanoBanana)** | ✅ Ready  | `NanoBananaService`    |
| **Image Rendering** | ✅ Ready  | `PlaywrightRenderer`   |
| **Prompts**         | ✅ Ported | `services/prompts.py`  |

## Setup & Running

### Prerequisites

- Python 3.10+
- Playwright Browsers

### Installation

```bash
cd pyapp
# Create venv
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Install Playwright browsers
playwright install chromium
```

### Running the Server

```bash
# Development
uvicorn pyapp.main:app --reload

# Production
uvicorn pyapp.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=pyapp
```

## Future Improvements

- **Redis Cache**: Implement caching layer (currently placeholder in config).
- **Rate Limiting**: Add `slowapi` or similar middleware.
- **Authentication**: Integrate with existing auth system if needed.
