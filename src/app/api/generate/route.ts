import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { createAIService } from '@/services'
import { generateXiaohongshuCopytext } from '@/services/copytext'
import { convertSvgToPng, createTempImageUrl } from '@/lib/image-converter'
import { AIModel, GeneratedCard } from '@/types'
import { APP_CONSTANTS, ERROR_MESSAGES } from '@/constants'
import type { GenerateResponse } from '@/types/api'
import { z } from 'zod'
import { jsonError, jsonOk } from '@/lib/http'
import { logger } from '@/lib/logger'
import { appConfig } from '@/config'
import { createRateLimiter } from '@/lib/rateLimiter'
import { cacheGet, cacheSet, makeKey } from '@/shared/lib/cache'
import { createHash } from 'crypto'

/** 请求体/响应体类型见 src/types/api.ts */

/**
 * 验证请求参数
 */
const GenerateSchema = z.object({
  text: z
    .string()
    .min(1, ERROR_MESSAGES.EMPTY_INPUT)
    .max(APP_CONSTANTS.MAX_TEXT_LENGTH, ERROR_MESSAGES.TEXT_TOO_LONG),
  model: z.enum(['deepseek', 'nanobanana']),
  style: z.enum(['simple', 'standard', 'rich']).optional(),
  size: z.enum(['1:1', '4:5', '9:16']).optional(),
})

const limiter = createRateLimiter(appConfig.features.rateLimit)

/**
 * 创建错误响应
 */
function createErrorResponse(
  error: string,
  status: number = 400,
  details?: string
): NextResponse<GenerateResponse> {
  logger.error('[API] 错误', { error, details }, 'Generate')
  return jsonError(error, status, details) as NextResponse<GenerateResponse>
}

export async function POST(req: NextRequest) {
  try {
    const requestData: unknown = await req.json()

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const allowed = await limiter.allow(`generate:${ip}`)
    if (!allowed) {
      return createErrorResponse('请求过于频繁，请稍后重试', 429)
    }

    // 验证请求参数
    const parsed = GenerateSchema.safeParse(requestData)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || '参数错误'
      return createErrorResponse(msg)
    }

    const { text, model, style, size } = parsed.data

    const key =
      'g:' +
      createHash('sha256')
        .update(makeKey([text, model, style, size]))
        .digest('hex')
    const cached = cacheGet<GenerateResponse>(key)
    if (cached) {
      return jsonOk(cached, 200, {
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=600',
        ETag: key,
      }) as NextResponse<GenerateResponse>
    }

    logger.info('开始处理生成请求', { textLength: text.length, model, style }, 'Generate')

    const cards: GeneratedCard[] = []
    let copytext = ''

    // 生成小红书文案
    copytext = await generateCopytext(text)

    // 生成卡片
    const card = await generateCard(text, model, style, size)

    if (card) {
      cards.push(card)
    }

    logger.info(
      '处理完成',
      { cardCount: cards.length, copytextLength: copytext.length },
      'Generate'
    )

    const response = { cards, copytext, success: true } satisfies GenerateResponse
    cacheSet(key, response, 60_000)
    return jsonOk(response, 200, {
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=600',
      ETag: key,
    }) as NextResponse<GenerateResponse>
  } catch (error) {
    logger.error('未预期错误', error, 'Generate')
    return createErrorResponse(
      ERROR_MESSAGES.SERVER_ERROR,
      500,
      error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
    )
  }
}

/**
 * 生成文案
 */
async function generateCopytext(text: string): Promise<string> {
  try {
    return await generateXiaohongshuCopytext(text)
  } catch (error) {
    logger.error('文案生成失败', error, 'Generate')
    return ERROR_MESSAGES.COPYTEXT_GENERATION_FAILED
  }
}

/**
 * 生成卡片
 */
async function generateCard(
  text: string,
  model: AIModel,
  style?: 'simple' | 'standard' | 'rich',
  size?: '1:1' | '4:5' | '9:16'
): Promise<GeneratedCard | null> {
  try {
    const aiService = createAIService(model)
    const { svgContent, designJson } = await aiService.process(text, { styleChoice: style })

    // 验证SVG内容
    if (!svgContent || svgContent.length < APP_CONSTANTS.MIN_SVG_CONTENT_LENGTH) {
      throw new Error(ERROR_MESSAGES.SVG_TOO_SMALL)
    }

    // 转换为PNG
    const pngBuffer = await convertSvgToPng(svgContent)
    const imageUrl = createTempImageUrl(pngBuffer, `${model}-card.png`)

    const card: GeneratedCard = {
      id: `${model}-${Date.now()}`,
      imageUrl,
      template: (designJson.template_type || 'standard') as any,
      model,
      size: size || '1:1',
    }

    logger.info(
      `${model}卡片生成成功`,
      { template: card.template, svgLength: svgContent.length, imageUrlLength: imageUrl.length },
      'Generate'
    )

    return card
  } catch (error) {
    const serviceName = model === 'deepseek' ? 'DeepSeek' : 'NanoBanana'
    logger.error(`${serviceName}卡片生成失败`, error, 'Generate')
    return null
  }
}
