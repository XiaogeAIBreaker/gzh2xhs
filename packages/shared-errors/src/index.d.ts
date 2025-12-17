export type ErrorCategory = "validation" | "auth" | "permission" | "not_found" | "conflict" | "rate_limit" | "internal";
export declare class AppError extends Error {
    readonly code: string;
    readonly category: ErrorCategory;
    readonly status: number;
    readonly cause?: unknown;
    constructor(params: {
        message: string;
        code: string;
        category: ErrorCategory;
        status?: number;
        cause?: unknown;
    });
    toResponse(requestId?: string): {
        code: string;
        message: string;
        requestId: string | undefined;
    };
}
export declare function mapStatus(category: ErrorCategory): number;
export declare class ValidationError extends AppError {
    constructor(message: string, code?: string, cause?: unknown);
}
