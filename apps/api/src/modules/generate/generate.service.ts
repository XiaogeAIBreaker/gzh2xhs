import { Injectable, BadRequestException, Inject, Logger } from '@nestjs/common'
import { GenerateInputDto } from './dto/generate-input.dto'
import { DeepSeekService } from './providers/deepseek.service'
import { NanoBananaService } from './providers/nanobanana.service'
import { CopytextService } from './lib/copytext.service'
import { convertSvgToPng, createTempImageUrl, createPlaceholderPngBuffer } from './lib/image-converter'
import { GeneratedCard, AIModel, GenerationOptions } from './types'
import { createHash } from 'crypto'
import { CacheProvider } from '../../shared/cache/cache.provider'

@Injectable()
export class GenerateService {
    private readonly logger = new Logger(GenerateService.name)

    constructor(
        private readonly deepSeekService: DeepSeekService,
        private readonly nanoBananaService: NanoBananaService,
        private readonly copytextService: CopytextService,
        @Inject('CACHE') private cacheManager: CacheProvider,
    ) {}

    async generate(input: GenerateInputDto): Promise<{ cards: GeneratedCard[], copytext: string, success: boolean }> {
        const { model, text, style, size } = input
        const cacheKey = this.makeCacheKey(text, model, style, size)

        const cached = await this.cacheManager.get<{ cards: GeneratedCard[], copytext: string, success: boolean }>(cacheKey)
        if (cached) {
            this.logger.log(`Cache hit for ${cacheKey}`)
            return cached
        }

        const options: GenerationOptions = { styleChoice: style }

        // Parallel execution
        const copytextPromise = this.copytextService.generate(text)
        const aiPromise = this.runAI(text, model, options)

        let imageUrl: string
        let designJson: any

        try {
            const { svgContent, designJson: dj } = await aiPromise
            designJson = dj
            imageUrl = await this.renderImage(svgContent, model)
        } catch (error) {
            this.logger.error('Generation failed, using placeholder', error)
            const buf = await createPlaceholderPngBuffer()
            imageUrl = createTempImageUrl(buf, `${model}-placeholder.png`)
            designJson = { template_type: 'standard' }
        }

        const copytext = await copytextPromise

        const output = this.buildOutput(model, size, imageUrl, designJson, copytext)

        // Cache for 60 seconds (like original)
        // CacheProvider uses seconds
        await this.cacheManager.set(cacheKey, output, 60)

        return output
    }

    private makeCacheKey(text: string, model: string, style?: string, size?: string): string {
        const raw = `${text}:${model}:${style}:${size}`
        const hash = createHash('sha256').update(raw).digest('hex')
        return `g:${hash}`
    }

    private async runAI(text: string, model: AIModel, options: GenerationOptions) {
        if (model === 'deepseek') {
            return this.deepSeekService.process(text, options)
        } else if (model === 'nanobanana') {
            return this.nanoBananaService.process(text, options)
        } else {
             throw new BadRequestException('Invalid model')
        }
    }

    private async renderImage(svgContent: string, model: AIModel): Promise<string> {
        const pngBuffer = await convertSvgToPng(svgContent)
        return createTempImageUrl(pngBuffer, `${model}-card.png`)
    }

    private buildOutput(
        model: AIModel,
        size: GenerateInputDto['size'],
        imageUrl: string,
        designJson: any,
        copytext: string,
    ): { cards: GeneratedCard[], copytext: string, success: boolean } {
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
