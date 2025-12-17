import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { createLogger } from '@gzh2xhs/shared-logger'

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    private readonly logger = createLogger({ level: process.env.LOG_LEVEL || 'info' })

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const http = context.switchToHttp()
        const req = http.getRequest<Request & { headers: Record<string, string> }>()
        const res = http.getResponse<any>()

        const method = (req as any).method
        const url = (req as any).url
        const userId = ((req as any).headers?.['x-user-id'] as string) || 'anonymous'
        const traceId =
            ((req as any).headers?.['x-request-id'] as string) ||
            (res.getHeader?.('x-request-id') as string) ||
            'n/a'

        return next.handle().pipe(
            tap({
                next: () => {
                    const statusCode = (res as any).statusCode
                    this.logger.info({ event: 'audit', actor: userId, action: method, path: url, status: statusCode, rid: traceId })
                },
                error: (err) => {
                    const statusCode = (res as any).statusCode
                    this.logger.warn({ event: 'audit', actor: userId, action: method, path: url, status: statusCode, rid: traceId, error: err?.message })
                },
            }),
        )
    }
}
