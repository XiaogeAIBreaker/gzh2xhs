import { NextRequest, NextResponse } from 'next/server'
import { jsonError, jsonOk, getClientIp } from '@/lib/http'
import { logger } from '@/lib/logger'
import { GenerateCardUseCase } from '@/application/usecases/GenerateCardUseCase'
import { createRequestContainer } from '@/container'
import { ERROR_MESSAGES } from '@/constants'
import { GenerateRequestSchema } from '@/types/schemas'

export class GenerateController {
  async post(req: NextRequest): Promise<NextResponse> {
    try {
      const body: unknown = await req.json()
      const parsed = GenerateRequestSchema.safeParse(body)
      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message || '参数错误'
        logger.error('[API] 错误', { error: msg }, 'Generate')
        return jsonError(msg, 400)
      }
      const ip = getClientIp(req)
      const c = createRequestContainer({ ip })
      const uc = new GenerateCardUseCase(c)
      const data = await uc.execute({ ...parsed.data, ip })
      return jsonOk(data, 200, {
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=600',
      })
    } catch (error) {
      logger.error('未预期错误', error, 'Generate')
      return jsonError(
        ERROR_MESSAGES.SERVER_ERROR,
        500,
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      )
    }
  }
}
