import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { createLogger } from '@gzh2xhs/shared-logger'

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    private readonly logger = createLogger({ level: process.env.LOG_LEVEL || 'info' })

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const started = Date.now()
        const http = context.switchToHttp()
        const req = http.getRequest<Request & { headers: Record<string, string> }>()
        const res = http.getResponse<any>()

        const method = (req as any).method
        const url = (req as any).url
        const traceId = ((req as any).headers?.['x-request-id'] as string) || this.randomId()

        res.setHeader?.('x-request-id', traceId)

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = Date.now() - started
                    try {
                        res.setHeader?.('x-duration-ms', String(duration))
                    } catch {}
                    const statusCode = (res as any).statusCode
                    this.logger.info({ event: 'metrics', method, path: url, status: statusCode, duration_ms: duration, rid: traceId })
                },
                error: (err) => {
                    const duration = Date.now() - started
                    const statusCode = (res as any).statusCode
                    this.logger.error({ event: 'metrics', method, path: url, status: statusCode, duration_ms: duration, rid: traceId, error: err?.message })
                },
            }),
        )
    }

    private randomId(): string {
        try {
            // Node.js >=16
            return require('crypto').randomUUID()
        } catch {
            return Math.random().toString(36).slice(2)
        }
    }
}
