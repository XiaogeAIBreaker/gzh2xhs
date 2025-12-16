import { NextRequest } from 'next/server'
import { createRateLimiter } from '@/shared/lib/rateLimiter'
import { jsonError } from '@/lib/http'
import { appConfig } from '@/config'
import { cacheGet, cacheSet, makeKey } from '@/shared/lib/cache'

const limiter = createRateLimiter(appConfig.features.rateLimit)

export function withRateLimit<TBody = any>(
    handler: (req: NextRequest, body?: TBody) => Promise<Response>,
): (req: NextRequest, body?: TBody) => Promise<Response> {
    return async (req: NextRequest, body?: TBody) => {
        const ip = req.headers.get('x-forwarded-for') || 'unknown'
        const key = `${ip}:${req.nextUrl.pathname}`
        const ok = await limiter.allow(key)
        if (!ok) {
            const traceId = req.headers.get('x-request-id') || undefined
            return jsonError('RATE_LIMITED', '请求过于频繁', 429, undefined, undefined, traceId)
        }
        return handler(req, body)
    }
}

export async function enforceIdempotency(req: NextRequest): Promise<Response | null> {
    const idem = req.headers.get('x-idempotency-key') || ''
    if (!idem) return null
    const key = makeKey(['idem', req.nextUrl.pathname, idem])
    const exists = cacheGet<boolean>(key)
    if (exists) {
        const traceId = req.headers.get('x-request-id') || undefined
        return jsonError(
            'IDEMPOTENT_CONFLICT',
            '重复的幂等请求',
            409,
            undefined,
            undefined,
            traceId,
        )
    }
    cacheSet<boolean>(key, true, 15 * 60_000)
    return null
}
