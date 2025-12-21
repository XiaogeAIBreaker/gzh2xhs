from typing import Any

from fastapi import HTTPException, status


class AppError(Exception):
    """Base application exception"""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", details: Any = None):
        self.message = message
        self.code = code
        self.details = details
        super().__init__(self.message)


class AIServiceError(AppError):
    """AI Service specific errors"""
    def __init__(self, message: str, details: Any = None):
        super().__init__(message, code="AI_SERVICE_ERROR", details=details)


class ImageGenerationError(AppError):
    """Image generation specific errors"""
    def __init__(self, message: str, details: Any = None):
        super().__init__(message, code="IMAGE_GENERATION_ERROR", details=details)


class ValidationError(AppError):
    """Validation errors"""
    def __init__(self, message: str, details: Any = None):
        super().__init__(message, code="VALIDATION_ERROR", details=details)


def app_exception_handler(request: Any, exc: AppError):
    """FastAPI exception handler for AppError"""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    if isinstance(exc, ValidationError):
        status_code = status.HTTP_400_BAD_REQUEST
    
    return {
        "error": {
            "code": exc.code,
            "message": exc.message,
            "details": exc.details
        }
    }
