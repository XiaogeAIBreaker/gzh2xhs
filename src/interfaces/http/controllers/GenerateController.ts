import { NextRequest, NextResponse } from 'next/server'
import { jsonError, jsonOk, getClientIp } from '@/lib/http'
import { logger } from '@/lib/logger'
import { counter, observe } from '@/shared/lib/metrics'
import { GenerateCardUseCase } from '@/application/usecases/GenerateCardUseCase'
import { createRequestContainer } from '@/container'
import { ERROR_MESSAGES } from '@/constants'
import { GenerateRequestSchema } from '@/types/schemas'

export class GenerateController {
  async post(req: NextRequest): Promise<NextResponse> {
    const start = Date.now()
    const variant =
      req.headers.get('x-experiment-variant') || req.cookies?.get('ab_variant')?.value || 'A'
    try {
      const body: unknown = await req.json()
      const parsed = GenerateRequestSchema.safeParse(body)
      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message || '参数错误'
        logger.error('[API] 错误', { error: msg }, 'Generate')
        counter('api_generate_fail', 1, { reason: 'validation' })
        return jsonError(msg, 400)
      }
      const ip = getClientIp(req)
      const c = createRequestContainer({ ip })
      const uc = new GenerateCardUseCase(c)
      const data = await uc.execute({ ...parsed.data, ip, variant: variant as any })
      const ms = Date.now() - start
      observe('api_generate_latency_ms', ms, { success: true, variant })
      counter('api_generate_ok', 1)
      return jsonOk(data, 200, {
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=600',
      })
    } catch (error) {
      logger.error('未预期错误', error, 'Generate')
      const ms = Date.now() - start
      observe('api_generate_latency_ms', ms, { success: false, variant })
      const reason =
        error instanceof Error && error.message === 'RATE_LIMITED' ? 'rate_limited' : 'error'
      counter('api_generate_fail', 1, { reason })
      return jsonError(
        ERROR_MESSAGES.SERVER_ERROR,
        500,
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      )
    }
  }
}
