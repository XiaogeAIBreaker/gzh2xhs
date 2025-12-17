export type Logger = {
    info: (obj: unknown) => void;
    warn: (obj: unknown) => void;
    error: (obj: unknown) => void;
    child?: (bindings: Record<string, unknown>) => Logger;
};
export type LoggerOptions = {
    level?: string;
};
export type LogContext = {
    rid?: string;
    scope?: string;
};
export declare function createLogger(_options?: LoggerOptions): Logger;
export declare function withContext(logger: Logger, ctx: LogContext): Logger;
export declare function logRequest(logger: Logger, info: {
    method: string;
    path: string;
    rid?: string;
}): void;
export declare function logResponse(logger: Logger, info: {
    status: number;
    durationMs: number;
    rid?: string;
    path?: string;
}): void;
