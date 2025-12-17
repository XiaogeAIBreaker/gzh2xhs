export type ErrorCategory = "validation" | "auth" | "permission" | "not_found" | "conflict" | "rate_limit" | "internal";

export class AppError extends Error {
  readonly code: string;
  readonly category: ErrorCategory;
  readonly status: number;
  readonly cause?: unknown;

  constructor(params: { message: string; code: string; category: ErrorCategory; status?: number; cause?: unknown }) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.category = params.category;
    this.status = params.status ?? mapStatus(params.category);
    this.cause = params.cause;
  }

  toResponse(requestId?: string) {
    return { code: this.code, message: this.message, requestId };
  }
}

export function mapStatus(category: ErrorCategory): number {
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

export class ValidationError extends AppError {
  constructor(message: string, code = "VALIDATION_ERROR", cause?: unknown) {
    super({ message, code, category: "validation", status: 400, cause });
  }
}
