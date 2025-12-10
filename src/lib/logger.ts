type LogLevel = 'info' | 'warn' | 'error' | 'debug'

function redact(value: any): any {
  const SENSITIVE_KEYS = /(apiKey|authorization|password|token|secret)/i

  function walk(v: any): any {
    if (v == null) return v
    if (typeof v === 'string') return v.length > 2000 ? v.slice(0, 2000) + '…' : v
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

function write(level: LogLevel, message: string, scope?: string, details?: any) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    scope: scope || 'app',
    message,
    details: details != null ? redact(details) : undefined,
  }
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : level === 'debug' ? 'debug' : 'log'](JSON.stringify(payload))
}

export const logger = {
  info: (msg: string, details?: any, scope?: string) => write('info', msg, scope, details),
  warn: (msg: string, details?: any, scope?: string) => write('warn', msg, scope, details),
  error: (msg: string, details?: any, scope?: string) => write('error', msg, scope, details),
  debug: (msg: string, details?: any, scope?: string) => write('debug', msg, scope, details),
}
