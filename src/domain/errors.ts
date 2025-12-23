export type AppErrorCode =
    | 'VALIDATION_ERROR'
    | 'RATE_LIMITED'
    | 'NOT_FOUND'
    | 'INTERNAL_ERROR'
    | 'BAD_REQUEST'

/**
 *
 */
export class AppError extends Error {
    code: AppErrorCode
    httpStatus: number
    details?: any
    /**
     *
     */
    constructor(message: string, code: AppErrorCode, httpStatus: number, details?: any) {
        super(message)
        this.code = code
        this.httpStatus = httpStatus
        this.details = details
    }
}

/**
 *
 */
export function badRequest(message: string, details?: any) {
    return new AppError(message, 'BAD_REQUEST', 400, details)
}

/**
 *
 */
export function validationError(message: string, details?: any) {
    return new AppError(message, 'VALIDATION_ERROR', 422, details)
}

/**
 *
 */
export function rateLimited(message: string) {
    return new AppError(message, 'RATE_LIMITED', 429)
}

/**
 *
 */
export function internalError(message: string, details?: any) {
    return new AppError(message, 'INTERNAL_ERROR', 500, details)
}
