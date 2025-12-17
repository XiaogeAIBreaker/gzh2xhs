import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { AppError } from '@gzh2xhs/shared-errors'
import { createLogger } from '@gzh2xhs/shared-logger'

const logger = createLogger({ level: process.env.LOG_LEVEL || 'info' })

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const req = ctx.getRequest<Request & { headers: Record<string, string> }>()
        const res = ctx.getResponse<any>()

        const rid = (req as any).headers?.['x-request-id'] as string | undefined

        if (exception instanceof AppError) {
            const body = exception.toResponse(rid)
            logger.error({ event: 'http_error', rid, code: exception.code, message: exception.message })
            res.status(exception.status).json(body)
            return
        }

        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
        const message = exception instanceof Error ? exception.message : 'Unexpected error'
        logger.error({ event: 'http_error', rid, status, message })
        res.status(status).json({ code: 'INTERNAL_ERROR', message, requestId: rid })
    }
}
