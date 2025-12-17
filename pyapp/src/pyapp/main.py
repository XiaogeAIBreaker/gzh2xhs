from fastapi import FastAPI
from .interfaces.middleware.common import add_common_middleware, add_exception_handlers
from .interfaces.controllers.generate import router as generate_router
from .interfaces.controllers.export import router as export_router
from .interfaces.controllers.finance import router as finance_router
from .interfaces.controllers.auth import router as auth_router
from .interfaces.controllers.data import router as data_router
from .interfaces.controllers.logs import router as logs_router
from .interfaces.controllers.kpi import router as kpi_router
from .interfaces.controllers.openapi import router as openapi_router

app = FastAPI(title="PyApp Service", version="0.1.0")
add_common_middleware(app)
add_exception_handlers(app)
app.include_router(generate_router, prefix="/api")
app.include_router(export_router, prefix="/api")
app.include_router(finance_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(data_router, prefix="/api")
app.include_router(logs_router, prefix="/api")
app.include_router(kpi_router, prefix="/api")
app.include_router(openapi_router, prefix="/api")
