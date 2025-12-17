export type Logger = {
  info: (obj: unknown) => void
  warn: (obj: unknown) => void
  error: (obj: unknown) => void
  child?: (bindings: Record<string, unknown>) => Logger
}

export type LoggerOptions = { level?: string }
export type LogContext = { rid?: string; scope?: string }

export function createLogger(_options: LoggerOptions = {}): Logger {
  const base = (level: 'info' | 'warn' | 'error') => (obj: unknown) => {
    try {
      // 输出结构化 JSON，便于采集
      // @ts-ignore
      console[level](JSON.stringify({ level, ts: Date.now(), ...(obj as any) }))
    } catch {
      // 退化输出
      // @ts-ignore
      console[level](obj)
    }
  }
  return { info: base('info'), warn: base('warn'), error: base('error') }
}

export function withContext(logger: Logger, ctx: LogContext): Logger {
  const child = (bindings: Record<string, unknown>) => {
    const base = (level: 'info' | 'warn' | 'error') => (obj: unknown) => {
      logger[level]({ ...(bindings as any), ...(obj as any) })
    }
    return { info: base('info'), warn: base('warn'), error: base('error'), child }
  }
  return child({ rid: ctx.rid, scope: ctx.scope })
}

export function logRequest(logger: Logger, info: { method: string; path: string; rid?: string }) {
  logger.info({ event: 'http_request', method: info.method, path: info.path, rid: info.rid })
}

export function logResponse(logger: Logger, info: { status: number; durationMs: number; rid?: string; path?: string }) {
  logger.info({ event: 'http_response', status: info.status, duration_ms: info.durationMs, rid: info.rid, path: info.path })
}
