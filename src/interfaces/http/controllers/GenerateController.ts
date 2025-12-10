import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { jsonError, jsonOk } from '@/lib/http'
import { logger } from '@/lib/logger'
import { GenerateCardUseCase } from '@/application/usecases/GenerateCardUseCase'
import { createRequestContainer } from '@/container'
import { APP_CONSTANTS, ERROR_MESSAGES } from '@/constants'

const GenerateSchema = z.object({
  text: z
    .string()
    .min(1, ERROR_MESSAGES.EMPTY_INPUT)
    .max(APP_CONSTANTS.MAX_TEXT_LENGTH, ERROR_MESSAGES.TEXT_TOO_LONG),
  model: z.enum(['deepseek', 'nanobanana']),
  style: z.enum(['simple', 'standard', 'rich']).optional(),
  size: z.enum(['1:1', '4:5', '9:16']).optional(),
})

export class GenerateController {
  async post(req: NextRequest): Promise<NextResponse> {
    try {
      const body: unknown = await req.json()
      const parsed = GenerateSchema.safeParse(body)
      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message || '参数错误'
        logger.error('[API] 错误', { error: msg }, 'Generate')
        return jsonError(msg, 400)
      }
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
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
