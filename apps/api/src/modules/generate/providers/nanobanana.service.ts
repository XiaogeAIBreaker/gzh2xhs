import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AIService } from '../lib/ai-service'
import { AIServiceResult, DesignJSON, GenerationOptions, AIMessage } from '../types'
import { ERROR_MESSAGES } from '../constants'
import {
    NANOBANANA_STAGE_A_SYSTEM,
    NANOBANANA_STAGE_B_SYSTEM,
    createNanoBananaStageAUserPrompt,
    createNanoBananaStageBUserPrompt,
} from '../lib/prompts'

@Injectable()
export class NanoBananaService extends AIService {
    constructor(configService: ConfigService) {
        super({
            apiKey: configService.get<string>('APICORE_AI_KEY') || '',
            apiUrl: configService.get<string>('NANOBANANA_API_URL') || 'https://kg-api.cloud/v1/chat/completions',
            model: 'gpt-5-chat-latest',
        }, 'NanoBanana')
    }

    async process(text: string, options?: GenerationOptions): Promise<AIServiceResult> {
        this.logInfo('开始处理文本', { textLength: text.length, options })

        try {
            // 阶段A：分析与设计JSON生成
            const designJson = await this.executeStageA(text, options)

            // 阶段B：SVG渲染
            const svgContent = await this.executeStageB(designJson, options)

            this.logInfo('处理完成', {
                designTemplate: designJson.template_type,
                svgLength: svgContent.length,
            })

            return { svgContent, designJson }
        } catch (error) {
            this.logError('处理失败', error)
            throw error
        }
    }

    /**
     * 执行阶段A：生成设计JSON
     */
    private async executeStageA(text: string, options?: GenerationOptions): Promise<DesignJSON> {
        this.logInfo('开始阶段A - 设计分析')

        const opt = options?.styleChoice ? { styleChoice: options.styleChoice } : {}
        const messages: AIMessage[] = [
            { role: 'system', content: NANOBANANA_STAGE_A_SYSTEM },
            { role: 'user', content: createNanoBananaStageAUserPrompt(text, opt as any) },
        ]

        const jsonResponse = await this.callAPI(messages)
        this.logInfo('阶段A 响应获取成功', { responseLength: jsonResponse.length })

        const cleanJsonResponse = this.cleanJsonResponse(jsonResponse)
        const designJson = this.parseJsonResponse<DesignJSON>(cleanJsonResponse)

        // 验证设计JSON的基本结构
        if (!designJson.template_type || !designJson.palette) {
            this.logError('设计JSON缺少必要字段', designJson)
            throw new Error(`${ERROR_MESSAGES.INVALID_JSON}: 缺少必要字段`)
        }

        this.logInfo('阶段A 完成', { templateType: designJson.template_type })
        return designJson
    }

    /**
     * 执行阶段B：生成SVG
     */
    private async executeStageB(
        designJson: DesignJSON,
        options?: GenerationOptions,
    ): Promise<string> {
        this.logInfo('开始阶段B - SVG渲染')

        const style = options?.styleChoice ?? 'standard'
        const messages: AIMessage[] = [
            { role: 'system', content: NANOBANANA_STAGE_B_SYSTEM },
            { role: 'user', content: createNanoBananaStageBUserPrompt(JSON.stringify(designJson), style) },
        ]

        const svgResponse = await this.callAPI(messages)
        const svgContent = this.extractSvgContent(svgResponse)

        this.logInfo('阶段B 完成', { svgLength: svgContent.length })
        return svgContent
    }
}
