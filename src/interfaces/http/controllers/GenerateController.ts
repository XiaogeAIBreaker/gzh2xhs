import { NextRequest, NextResponse } from 'next/server'
import { jsonError, jsonOk, getClientIp, jsonErrorFromAppError } from '@/lib/http'
import { logger } from '@/lib/logger'
import { counter, observe } from '@/shared/lib/metrics'
import { trackServer } from '@/shared/lib/analytics'
import { GenerateCardUseCase } from '@/application/usecases/GenerateCardUseCase'
import { createRequestContainer } from '@/container'
import { ERROR_MESSAGES } from '@/constants'
import { GenerateRequestSchema } from '@/types/schemas'

export class GenerateController {
    async post(req: NextRequest): Promise<NextResponse> {
        const start = Date.now()
        const variant = this.getVariant(req)

        try {
            const body: unknown = await req.json()
            const parsed = GenerateRequestSchema.safeParse(body)
            if (!parsed.success) return this.handleValidationFail(req, parsed.error)
            const ip = getClientIp(req)
            const c = createRequestContainer({ ip })
            const uc = new GenerateCardUseCase(c)
            const data = await uc.execute({ ...parsed.data, ip, variant: variant as any })

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

        return jsonOk(data, 200, {
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
