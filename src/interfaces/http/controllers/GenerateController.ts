import { NextRequest, NextResponse } from 'next/server'
import { jsonError, jsonOk, getClientIp, jsonErrorFromAppError, jsonOkWithETag } from '@/lib/http'
import { logger } from '@/lib/logger'
import { counter, observe } from '@/shared/lib/metrics'
import { trackServer } from '@/shared/lib/analytics'
import { GenerateCardUseCase } from '@/application/usecases/GenerateCardUseCase'
import { globalLimiter } from '@/shared/lib/concurrency'
import { appConfig } from '@/config'
import { createRequestContainer } from '@/container'
import { ERROR_MESSAGES } from '@/constants'
import { GenerateRequestSchema, type GenerateRequestDto } from '@/types/schemas'
import { createRateLimiter } from '@/shared/lib/rateLimiter'
import { cacheGet, cacheSet, makeKey } from '@/shared/lib/cache'

export class GenerateController {
    async post(req: NextRequest): Promise<NextResponse> {
        const start = Date.now()
        const variant = this.getVariant(req)
        const traceId = this.getTraceId(req)
        const ip = getClientIp(req)
        const idemKey = req.headers.get('x-idempotency-key') || undefined
        const limiter = createRateLimiter({ windowMs: 60_000, max: 60 })
        const allowed = await limiter.allow(makeKey(['gen', ip]))
        if (!allowed)
            return jsonError('RATE_LIMITED', '访问过于频繁', 429, undefined, undefined, traceId)

        if (idemKey) {
            const cached = cacheGet<any>(makeKey(['gen', idemKey]))
            if (cached) return jsonOk(cached, 200)
        }

        try {
            const body: unknown = await req.json()
            const parsed = GenerateRequestSchema.safeParse(body)
            if (!parsed.success) return this.handleValidationFail(req, parsed.error)
            const c = createRequestContainer({ ip })
            const uc = new GenerateCardUseCase(c)
            const data = await globalLimiter.run(() =>
                uc.execute({ ...parsed.data, ip, variant: variant as any }),
            )

            if (idemKey)
                cacheSet(makeKey(['gen', idemKey]), data, appConfig.features.caching.readTtlMs)
            return this.handleOk(req, data, variant, start)
        } catch (error) {
            return this.handleError(req, error, variant, start)
        }
    }

    async postValidated(req: NextRequest, dto: GenerateRequestDto): Promise<NextResponse> {
        const start = Date.now()
        const variant = this.getVariant(req)
        const traceId = this.getTraceId(req)
        const ip = getClientIp(req)
        const idemKey = req.headers.get('x-idempotency-key') || undefined
        const limiter = createRateLimiter({ windowMs: 60_000, max: 60 })
        const allowed = await limiter.allow(makeKey(['gen', ip]))
        if (!allowed)
            return jsonError('RATE_LIMITED', '访问过于频繁', 429, undefined, undefined, traceId)

        if (idemKey) {
            const cached = cacheGet<any>(makeKey(['gen', idemKey]))
            if (cached) return jsonOk(cached, 200)
        }

        try {
            const c = createRequestContainer({ ip })
            const uc = new GenerateCardUseCase(c)
            const data = await globalLimiter.run(() =>
                uc.execute({ ...dto, ip, variant: variant as any }),
            )

            if (idemKey)
                cacheSet(makeKey(['gen', idemKey]), data, appConfig.features.caching.readTtlMs)
            return this.handleOk(req, data, variant, start)
        } catch (error) {
            return this.handleError(req, error, variant, start)
        }
    }

    private getVariant(req: NextRequest): string {
        return (
            req.headers.get('x-experiment-variant') || req.cookies?.get('ab_variant')?.value || 'A'
        )
    }

    private getTraceId(req: NextRequest): string | undefined {
        return req.headers.get('x-request-id') || undefined
    }

    private handleValidationFail(req: NextRequest, error: any): NextResponse {
        const msg = error.issues?.[0]?.message || '参数错误'
        logger.error('[API] 错误', { error: msg }, 'Generate', this.getTraceId(req))
        counter('api_generate_fail', 1, { reason: 'validation' })
        const fields = (error.issues || []).reduce(
            (acc: Record<string, string[]>, issue: any) => {
                const path = issue.path?.join('.') || 'request'
                if (!acc[path]) acc[path] = []
                acc[path].push(issue.message)

                return acc
            },
            {} as Record<string, string[]>,
        )

        return jsonError('VALIDATION_ERROR', msg, 400, fields, undefined, this.getTraceId(req))
    }

    private handleOk(req: NextRequest, data: any, variant: string, start: number): NextResponse {
        const ms = Date.now() - start
        observe('api_generate_latency_ms', ms, { success: true, variant })
        counter('api_generate_ok', 1)
        trackServer(req as any, 'generate_success', { variant })

        return jsonOkWithETag(req, data, 200, {
            'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=600',
        })
    }

    private handleError(
        req: NextRequest,
        error: unknown,
        variant: string,
        start: number,
    ): NextResponse {
        const traceId = this.getTraceId(req)
        logger.error('未预期错误', error, 'Generate', traceId)
        const ms = Date.now() - start
        observe('api_generate_latency_ms', ms, { success: false, variant })
        const isRateLimited = error instanceof Error && (error as any).code === 'RATE_LIMITED'
        const reason = isRateLimited ? 'rate_limited' : 'error'
        counter('api_generate_fail', 1, { reason })
        trackServer(req as any, 'generate_fail', { variant, reason })
        if (
            error &&
            typeof error === 'object' &&
            (error as any).code &&
            (error as any).httpStatus
        ) {
            return jsonErrorFromAppError(error as any, traceId)
        }

        return jsonError(
            'SERVER_ERROR',
            ERROR_MESSAGES.SERVER_ERROR,
            500,
            undefined,
            undefined,
            traceId,
        )
    }
}
