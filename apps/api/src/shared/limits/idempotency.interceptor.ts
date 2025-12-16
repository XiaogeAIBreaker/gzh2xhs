import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, of } from 'rxjs'

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
    private readonly ttlSeconds = 15 * 60
    private memory = new Map<string, number>()

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest()
        const idem = (req.headers['x-idempotency-key'] as string) || ''
        if (!idem) return next.handle()
        const key = `idem:${req.path}:${idem}`
        const exp = this.memory.get(key)
        const now = Date.now()
        if (exp && exp > now) {
            return of({ statusCode: 409, message: 'IDEMPOTENT_CONFLICT' })
        }
        this.memory.set(key, now + this.ttlSeconds * 1000)
        return next.handle()
    }
}
