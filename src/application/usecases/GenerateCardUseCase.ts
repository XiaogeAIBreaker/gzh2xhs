import type { AIModel, GeneratedCard } from '@/types'
import { convertSvgToPng, createTempImageUrl } from '@/lib/image-converter'
import { createHash } from 'crypto'
import { createAIService } from '@/services'
import { generateXiaohongshuCopytext } from '@/services/copytext'
import type { AppContainer } from '@/container'
import { counter, observe } from '@/shared/lib/metrics'

export type GenerateInput = {
  text: string
  model: AIModel
  style?: 'simple' | 'standard' | 'rich' | undefined
  size?: '1:1' | '4:5' | '9:16' | undefined
  ip?: string | undefined
  variant?: 'A' | 'B' | undefined
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
    const { text, model, style, size, ip, variant } = input
    const cacheKey = this.makeCacheKey(text, model, style, size)
    const hit = this.c.cacheRepo.get<GenerateOutput>(cacheKey)
    counter(hit ? 'cache_hit_generate' : 'cache_miss_generate', 1)
    const out =
      hit ??
      (await (async () => {
        await this.ensureAllowed(ip)
        const copytext = await this.makeCopytext(text)
        const { svgContent, designJson } = await this.runAI(text, model, style, variant)
        const imageUrl = await this.renderImage(svgContent, model)
        return this.buildOutput(model, size, imageUrl, designJson, copytext)
      })())
    if (!hit) this.c.cacheRepo.set(cacheKey, out, 60_000)
    return out
  }

  private makeCacheKey(text: string, model: AIModel, style?: any, size?: any): string {
    return (
      'g:' +
      createHash('sha256')
        .update(this.c.cacheRepo.makeKey([text, model, style, size]))
        .digest('hex')
    )
  }

  private async ensureAllowed(ip?: string): Promise<void> {
    if (!ip) return
    const allowed = await this.c.rateLimiterRepo.allow(`generate:${ip}`)
    if (!allowed) {
      counter('rate_limited_generate', 1)
      throw new Error('RATE_LIMITED')
    }
  }

  private async makeCopytext(text: string): Promise<string> {
    const t = Date.now()
    const ct = await generateXiaohongshuCopytext(text)
    observe('copytext_time_ms', Date.now() - t)
    return ct
  }

  private async runAI(
    text: string,
    model: AIModel,
    style?: 'simple' | 'standard' | 'rich',
    variant?: 'A' | 'B'
  ) {
    const aiService = createAIService(model)
    const styleChoice = style || (variant === 'B' ? 'rich' : undefined)
    const styleOpt = styleChoice ? { styleChoice } : {}
    const t = Date.now()
    const res = await aiService.process(text, styleOpt as any)
    observe('ai_process_time_ms', Date.now() - t, { model })
    return res
  }

  private async renderImage(svgContent: string, model: AIModel): Promise<string> {
    const t = Date.now()
    const pngBuffer = await convertSvgToPng(svgContent)
    observe('image_convert_time_ms', Date.now() - t)
    return createTempImageUrl(pngBuffer, `${model}-card.png`)
  }

  private buildOutput(
    model: AIModel,
    size: GenerateInput['size'],
    imageUrl: string,
    designJson: any,
    copytext: string
  ): GenerateOutput {
    const cards: GeneratedCard[] = [
      {
        id: `${model}-${Date.now()}`,
        imageUrl,
        template: (designJson.template_type || 'standard') as any,
        model,
        size: size || '1:1',
      },
    ]
    return { cards, copytext, success: true }
  }
}
