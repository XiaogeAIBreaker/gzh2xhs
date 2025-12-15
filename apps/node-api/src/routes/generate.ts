import Router from '@koa/router'
import crypto from 'crypto'
import type { DefaultContext, DefaultState } from 'koa'
import { z } from 'zod'
import { GenerateRequestSchema } from '@/types/schemas'
import { createRequestContainer } from '@/container'
import { GenerateCardUseCase } from '@/application/usecases/GenerateCardUseCase'
import { createRateLimiter } from '@/shared/lib/rateLimiter'
import { cacheGet, cacheSet, makeKey } from '@/shared/lib/cache'
import { appConfig } from '@/config'

export const router = new Router<DefaultState, DefaultContext>()

router.post('/generate', async (ctx) => {
    const traceId = ctx.state.requestId as string | undefined
    const ip = extractIp(ctx)
    const variant = ctx.get('x-experiment-variant') || 'A'
    const idemKey = ctx.get('x-idempotency-key') || undefined
    const limiter = createRateLimiter({ windowMs: 60_000, max: 60 })
    const allowed = await limiter.allow(makeKey(['gen', ip]))
    if (!allowed) {
        ctx.status = 429
        ctx.body = { code: 'RATE_LIMITED', message: '访问过于频繁', traceId }
        return
    }

    if (idemKey) {
        const cached = cacheGet<any>(makeKey(['gen', idemKey]))
        if (cached) {
            setETag(ctx, cached)
            ctx.status = 200
            ctx.body = cached
            return
        }
    }

    const parsed = safeParse(GenerateRequestSchema, ctx.request.body)
    if (!parsed.ok) {
        ctx.status = 400
        ctx.body = {
            code: 'VALIDATION_ERROR',
            message: parsed.message,
            fields: parsed.fields,
            traceId,
        }
        return
    }

    const c = createRequestContainer({ ip, requestId: traceId })
    const uc = new GenerateCardUseCase(c)
    const data = await uc.execute({ ...parsed.data, ip, variant: variant as any })

    if (idemKey) cacheSet(makeKey(['gen', idemKey]), data, appConfig.features.caching.readTtlMs)
    setETag(ctx, data)
    ctx.status = 200
    ctx.body = data
})

function safeParse<T extends z.ZodTypeAny>(schema: T, raw: any) {
    const r = schema.safeParse(raw)
    if (r.success) return { ok: true as const, data: r.data }
    const fields = (r.error.issues || []).reduce(
        (acc: Record<string, string[]>, issue) => {
            const path = issue.path?.join('.') || 'request'
            if (!acc[path]) acc[path] = []
            acc[path].push(issue.message)
            return acc
        },
        {} as Record<string, string[]>,
    )
    const msg = r.error.issues?.[0]?.message || '参数错误'
    return { ok: false as const, message: msg, fields }
}

function extractIp(ctx: any): string | undefined {
    const xfwd = ctx.get('x-forwarded-for')
    const xreal = ctx.get('x-real-ip')
    const src = (xfwd ?? xreal ?? '') || ''
    const ip = String(src).split(',')[0]?.trim?.() || ''
    return ip || undefined
}

function setETag(ctx: any, data: any) {
    const payload = JSON.stringify(data)
    const hash = crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16)
    const etag = `W/"${hash}"`
    const inm = ctx.get('if-none-match')
    ctx.set('ETag', etag)
    if (!ctx.response.get('Cache-Control')) {
        ctx.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=600')
    }
    if (inm && inm === etag) {
        ctx.status = 304
        ctx.body = null
    }
}
