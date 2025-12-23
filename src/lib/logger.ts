type LogLevel = 'info' | 'warn' | 'error' | 'debug'

/**
 * 深度遍历并脱敏敏感字段，同时统一字符串截断方式。
 */
function redact(value: any): any {
    const SENSITIVE_KEYS = /(apiKey|authorization|password|token|secret)/i

    function walk(v: any): any {
        if (v == null) return v
        if (typeof v === 'string') return v.length > 2000 ? `${v.slice(0, 2000)}…` : v
        if (Array.isArray(v)) return v.map(walk)
        if (typeof v === 'object') {
            const out: Record<string, any> = {}
            for (const [k, val] of Object.entries(v)) {
                out[k] = SENSITIVE_KEYS.test(k) ? '***redacted***' : walk(val)
            }
            return out
        }
        return v
    }

    return walk(value)
}

/**
 * 输出结构化日志（JSON），支持 traceId 与作用域。
 */
function write(level: LogLevel, message: string, scope?: string, details?: any, traceId?: string) {
    const payload = {
        ts: new Date().toISOString(),
        level,
        scope: scope || 'app',
        message,
        details: details != null ? redact(details) : undefined,
        traceId,
    }
    console[
        level === 'error'
            ? 'error'
            : level === 'warn'
              ? 'warn'
              : level === 'debug'
                ? 'debug'
                : 'log'
    ](JSON.stringify(payload))
}

export const logger = {
    info: (msg: string, details?: any, scope?: string, traceId?: string) =>
        write('info', msg, scope, details, traceId),
    warn: (msg: string, details?: any, scope?: string, traceId?: string) =>
        write('warn', msg, scope, details, traceId),
    error: (msg: string, details?: any, scope?: string, traceId?: string) =>
        write('error', msg, scope, details, traceId),
    debug: (msg: string, details?: any, scope?: string, traceId?: string) =>
        write('debug', msg, scope, details, traceId),
}

/**
 *
 */
export function withContext(ctx: { traceId?: string; scope?: string }) {
    return {
        info: (msg: string, details?: any) => write('info', msg, ctx.scope, details, ctx.traceId),
        warn: (msg: string, details?: any) => write('warn', msg, ctx.scope, details, ctx.traceId),
        error: (msg: string, details?: any) => write('error', msg, ctx.scope, details, ctx.traceId),
        debug: (msg: string, details?: any) => write('debug', msg, ctx.scope, details, ctx.traceId),
    }
}
