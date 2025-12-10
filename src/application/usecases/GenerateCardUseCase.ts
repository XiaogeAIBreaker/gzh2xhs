import type { AIModel, GeneratedCard } from '@/types'
import { APP_CONSTANTS, ERROR_MESSAGES } from '@/constants'
import { convertSvgToPng, createTempImageUrl } from '@/lib/image-converter'
import { createHash } from 'crypto'
import { createAIService } from '@/services'
import { generateXiaohongshuCopytext } from '@/services/copytext'
import type { AppContainer } from '@/container'

export type GenerateInput = {
  text: string
  model: AIModel
  style?: 'simple' | 'standard' | 'rich' | undefined
  size?: '1:1' | '4:5' | '9:16' | undefined
  ip?: string | undefined
}

export type GenerateOutput = {
  cards: GeneratedCard[]
  copytext: string
  success: boolean
}

export class GenerateCardUseCase {
  private c: AppContainer
  constructor(c: AppContainer) {
    this.c = c
  }

  async execute(input: GenerateInput): Promise<GenerateOutput> {
    const { text, model, style, size, ip } = input
    const key =
      'g:' +
      createHash('sha256')
        .update(this.c.cacheRepo.makeKey([text, model, style, size]))
        .digest('hex')
    const cached = this.c.cacheRepo.get<GenerateOutput>(key)
    if (cached) return cached

    if (ip) {
      const allowed = await this.c.rateLimiterRepo.allow(`generate:${ip}`)
      if (!allowed) {
        throw new Error('RATE_LIMITED')
      }
    }

    const cards: GeneratedCard[] = []
    const copytext = await generateXiaohongshuCopytext(text)

    const aiService = createAIService(model)
    const styleOpt = style ? { styleChoice: style } : {}
    const { svgContent, designJson } = await aiService.process(text, styleOpt as any)
    if (!svgContent || svgContent.length < APP_CONSTANTS.MIN_SVG_CONTENT_LENGTH) {
      throw new Error(ERROR_MESSAGES.SVG_TOO_SMALL)
    }
    const pngBuffer = await convertSvgToPng(svgContent)
    const imageUrl = createTempImageUrl(pngBuffer, `${model}-card.png`)

    const card: GeneratedCard = {
      id: `${model}-${Date.now()}`,
      imageUrl,
      template: (designJson.template_type || 'standard') as any,
      model,
      size: size || '1:1',
    }
    cards.push(card)

    const out: GenerateOutput = { cards, copytext, success: true }
    this.c.cacheRepo.set(key, out, 60_000)
    return out
  }
}
