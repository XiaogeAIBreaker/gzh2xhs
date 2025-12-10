type LogLevel = 'info' | 'warn' | 'error' | 'debug'

function write(level: LogLevel, message: string, scope?: string, details?: any) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    scope: scope || 'app',
    message,
    details: details ?? undefined,
  }
  // 简单结构化输出，方便后续接入日志系统
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : level === 'debug' ? 'debug' : 'log'](JSON.stringify(payload))
}

export const logger = {
  info: (msg: string, details?: any, scope?: string) => write('info', msg, scope, details),
  warn: (msg: string, details?: any, scope?: string) => write('warn', msg, scope, details),
  error: (msg: string, details?: any, scope?: string) => write('error', msg, scope, details),
  debug: (msg: string, details?: any, scope?: string) => write('debug', msg, scope, details),
}

