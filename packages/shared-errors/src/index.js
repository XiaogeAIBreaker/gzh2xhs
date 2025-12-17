"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.AppError = void 0;
exports.mapStatus = mapStatus;
class AppError extends Error {
    constructor(params) {
        super(params.message);
        this.name = "AppError";
        this.code = params.code;
        this.category = params.category;
        this.status = params.status ?? mapStatus(params.category);
        this.cause = params.cause;
    }
    toResponse(requestId) {
        return { code: this.code, message: this.message, requestId };
    }
}
exports.AppError = AppError;
function mapStatus(category) {
    switch (category) {
        case "validation":
            return 400;
        case "auth":
            return 401;
        case "permission":
            return 403;
        case "not_found":
            return 404;
        case "conflict":
            return 409;
        case "rate_limit":
            return 429;
        default:
            return 500;
    }
}
class ValidationError extends AppError {
    constructor(message, code = "VALIDATION_ERROR", cause) {
        super({ message, code, category: "validation", status: 400, cause });
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=index.js.map