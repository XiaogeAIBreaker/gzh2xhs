import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'

type Hit = { windowStart: number; count: number }

@Injectable()
export class RateLimitGuard implements CanActivate {
    private readonly windowMs = 60_000
    private readonly max = 60
    private memoryHits = new Map<string, Hit>()

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest()
        const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown'
        const key = `${ip}:${req.path}`

        const now = Date.now()
        const windowStart = Math.floor(now / this.windowMs) * this.windowMs
        const hit = this.memoryHits.get(key)
        if (!hit || now - hit.windowStart >= this.windowMs) {
            this.memoryHits.set(key, { windowStart, count: 1 })
            return true
        }
        if (hit.count >= this.max) return false
        hit.count += 1
        return true
    }
}
