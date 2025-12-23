# GZH2XHS Backend (Python Refactor)

This is the refactored Python backend for the GZH2XHS project.

## Features

- **Authentication**: JWT-based auth with Login/Register.
- **Generation**: AI-powered card generation (WeChat to XiaoHongShu).
- **Finance**: Pricing, Risk, Reporting modules.
- **Architecture**: Modular, Domain-Driven Design using FastAPI.

## Tech Stack

- **Framework**: FastAPI
- **Database**: SQLAlchemy (Async), PostgreSQL (Production), SQLite (Dev)
- **Caching**: Redis
- **Task Queue**: (Planned) Celery/Redis
- **Testing**: Pytest
- **Linting**: Ruff, Mypy

## Setup

1. **Install Dependencies**

    ```bash
    pip install -r requirements.txt
    ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and configure:

    ```bash
    cp .env.example .env
    ```

3. **Run Application**
    ```bash
    uvicorn pyapp.main:app --reload
    ```
4. **Run Tests**
    ```bash
    pytest
    ```

## Project Structure

```
pyapp/
├── src/
│   └── pyapp/
│       ├── core/           # Config, Logging, Database
│       ├── modules/        # Business Modules
│       │   ├── auth/       # Authentication
│       │   ├── finance/    # Finance Logic
│       │   ├── generate/   # Card Generation
│       │   └── ...
│       └── main.py         # Entrypoint
├── tests/                  # Unit & Integration Tests
└── requirements.txt
```

## API Documentation

Once running, visit:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
