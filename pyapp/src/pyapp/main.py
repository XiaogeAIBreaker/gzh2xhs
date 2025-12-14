from fastapi import FastAPI
from .interfaces.middleware.common import add_common_middleware
from .interfaces.controllers.generate import router as generate_router

app = FastAPI(title="PyApp Service", version="0.1.0")
add_common_middleware(app)
app.include_router(generate_router, prefix="/api")

