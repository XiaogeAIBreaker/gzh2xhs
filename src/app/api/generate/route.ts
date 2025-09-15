import { NextRequest, NextResponse } from 'next/server'
import { createAIService } from '@/services'
import { generateXiaohongshuCopytext } from '@/services/copytext'
import { convertSvgToPng, createTempImageUrl } from '@/lib/image-converter'
import { AIModel, GeneratedCard } from '@/types'
import { APP_CONSTANTS, ERROR_MESSAGES } from '@/constants'

/**
 * 请求体接口
 */
interface GenerateRequest {
  text: string
  model: AIModel
  style?: 'simple' | 'standard' | 'rich'
}

/**
 * 响应体接口
 */
interface GenerateResponse {
  cards: GeneratedCard[]
  copytext: string
  success: boolean
  error?: string
  details?: string
}

/**
 * 验证请求参数
 */
function validateRequest(data: any): { isValid: boolean; error?: string } {
  const { text, model } = data

  // 检查必要字段
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: ERROR_MESSAGES.EMPTY_INPUT }
  }

  if (!text.trim()) {
    return { isValid: false, error: ERROR_MESSAGES.EMPTY_INPUT }
  }

  if (text.length > APP_CONSTANTS.MAX_TEXT_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.TEXT_TOO_LONG }
  }

  if (!model || !['deepseek', 'nanobanana'].includes(model)) {
    return { isValid: false, error: '不支持的AI模型' }
  }

  return { isValid: true }
}

/**
 * 创建错误响应
 */
function createErrorResponse(error: string, status: number = 400, details?: string): NextResponse<GenerateResponse> {
  console.error(`[API错误] ${error}`, details ? { details } : '')
  return NextResponse.json({
    cards: [],
    copytext: '',
    success: false,
    error,
    details
  }, { status })
}

/**
 * 创建成功响应
 */
function createSuccessResponse(cards: GeneratedCard[], copytext: string): NextResponse<GenerateResponse> {
  return NextResponse.json({
    cards,
    copytext,
    success: true
  })
}

export async function POST(req: NextRequest) {
  try {
    const requestData: GenerateRequest = await req.json()

    // 验证请求参数
    const validation = validateRequest(requestData)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!)
    }

    const { text, model, style } = requestData

    console.log(`[API] 开始处理生成请求`, {
      textLength: text.length,
      model,
      style
    })

    const cards: GeneratedCard[] = []
    let copytext = ''

    // 生成小红书文案
    copytext = await generateCopytext(text)

    // 生成卡片
    const card = await generateCard(text, model, style)

    if (card) {
      cards.push(card)
    }

    console.log(`[API] 处理完成`, {
      cardCount: cards.length,
      copytextLength: copytext.length
    })

    return createSuccessResponse(cards, copytext)

  } catch (error) {
    console.error('[API] 未预期错误:', error)
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
    console.error('[API] 文案生成失败:', error)
    return ERROR_MESSAGES.COPYTEXT_GENERATION_FAILED
  }
}

/**
 * 生成卡片
 */
async function generateCard(
  text: string,
  model: AIModel,
  style?: 'simple' | 'standard' | 'rich'
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
      model
    }

    console.log(`[API] ${model}卡片生成成功`, {
      template: card.template,
      svgLength: svgContent.length,
      imageUrlLength: imageUrl.length
    })

    return card
  } catch (error) {
    const serviceName = model === 'deepseek' ? 'DeepSeek' : 'NanoBanana'
    console.error(`[API] ${serviceName}卡片生成失败:`, error)

    // 这里不抛出错误，而是返回null，让上层决定如何处理
    throw new Error(`${serviceName} ${ERROR_MESSAGES.GENERATION_FAILED}: ${error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR}`)
  }
}
