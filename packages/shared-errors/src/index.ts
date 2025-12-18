/**
 * 错误分类枚举，统一错误归类用于映射 HTTP 状态码与可观测性标签。
 */
export type ErrorCategory = "validation" | "auth" | "permission" | "not_found" | "conflict" | "rate_limit" | "internal";

/**
 * 统一应用错误类型。所有业务与系统异常应包装为 AppError 后再向外抛出。
 * @example
 * throw new AppError({ message: '参数错误', code: 'INVALID_PARAM', category: 'validation' })
 */
export class AppError extends Error {
  readonly code: string;
  readonly category: ErrorCategory;
  readonly status: number;
  readonly cause?: unknown;

  /**
   * 构造函数
   * @param params 错误参数，包含消息、错误码、分类、HTTP 状态与底层原因
   */
  constructor(params: { message: string; code: string; category: ErrorCategory; status?: number; cause?: unknown }) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.category = params.category;
    this.status = params.status ?? mapStatus(params.category);
    this.cause = params.cause;
  }

  /**
   * 将错误映射为标准化响应体
   * @param requestId 可选的请求追踪 ID
   */
  toResponse(requestId?: string) {
    return { code: this.code, message: this.message, requestId };
  }
}

/**
 * 根据错误分类映射 HTTP 状态码。
 */
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

/**
 * 常见的参数校验错误封装。
 */
export class ValidationError extends AppError {
  constructor(message: string, code = "VALIDATION_ERROR", cause?: unknown) {
    super({ message, code, category: "validation", status: 400, cause });
  }
}
