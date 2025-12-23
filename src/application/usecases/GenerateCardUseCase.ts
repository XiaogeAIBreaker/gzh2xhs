import type { AIModel, GeneratedCard } from '@/types'
import {
    convertSvgToPng,
    createTempImageUrl,
    createPlaceholderPngBuffer,
} from '@/lib/image-converter'
import { createHash } from 'crypto'
import type { AIService } from '@/services'
import { generateXiaohongshuCopytext } from '@/services/copytext'
import type { AppContainer } from '@/container'
import { counter, observe } from '@/shared/lib/metrics'
import { rateLimited } from '@/domain/errors'
import { APP_CONSTANTS } from '@/constants'

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

/**
 *
 */
export class GenerateCardUseCase {
    private c: AppContainer
    /**
     *
     */
    constructor(c: AppContainer) {
        this.c = c
    }

    /**
     *
     */
    async execute(input: GenerateInput): Promise<GenerateOutput> {
        const { text, model, style, size, ip, variant } = input
        const cacheKey = this.makeCacheKey(text, model, style, size)
        const hit = this.c.cacheRepo.get<GenerateOutput>(cacheKey)
        counter(hit ? 'cache_hit_generate' : 'cache_miss_generate', 1)
        const out =
            hit ??
            (await (async () => {
                await this.ensureAllowed(ip)
                const copytextPromise = this.makeCopytext(text)
                const aiPromise = this.withRetry(
                    () =>
                        this.withTimeout(
                            () => this.runAI(text, model, style, variant),
                            APP_CONSTANTS.TIMEOUTS.API_REQUEST,
                        ),
                    2,
                )
                const copytext = await copytextPromise
                let imageUrl: string
                let designJson: any

                try {
                    const { svgContent, designJson: dj } = await aiPromise
                    designJson = dj
                    imageUrl = await this.renderImage(svgContent, model)
                } catch {
                    const buf = await createPlaceholderPngBuffer()
                    imageUrl = createTempImageUrl(buf, `${model}-placeholder.png`)
                    designJson = { template_type: 'standard' }
                }

                return this.buildOutput(model, size, imageUrl, designJson, copytext)
            })())
        if (!hit) this.c.cacheRepo.set(cacheKey, out, 60_000)

        return out
    }

    /**
     * 生成缓存键（g: 前缀 + 输入哈希）。
     */
    private makeCacheKey(text: string, model: AIModel, style?: any, size?: any): string {
        const raw = this.c.cacheRepo.makeKey([text, model, style, size])
        const hash = createHash('sha256').update(raw).digest('hex')
        return `g:${hash}`
    }

    private async ensureAllowed(ip?: string): Promise<void> {
        if (!ip) return
        const allowed = await this.c.rateLimiterRepo.allow(`generate:${ip}`)

        if (!allowed) {
            counter('rate_limited_generate', 1)
            throw rateLimited('触发限流')
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
        variant?: 'A' | 'B',
    ) {
        const aiService: AIService = this.c.aiProvider.getService(model)
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
        copytext: string,
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

    private async withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
        const timer = new Promise<never>((_, reject) => {
            const id = setTimeout(() => {
                clearTimeout(id)
                reject(new Error('TIMEOUT'))
            }, ms)
        })

        return Promise.race([fn(), timer])
    }

    private async withRetry<T>(fn: () => Promise<T>, attempts: number): Promise<T> {
        let lastErr: any

        for (let i = 0; i < attempts; i++) {
            try {
                return await fn()
            } catch (err) {
                lastErr = err
                await new Promise((r) => setTimeout(r, Math.min(1000 * (i + 1), 3000)))
            }
        }

        throw lastErr
    }
}
