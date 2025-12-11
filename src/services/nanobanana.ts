import { AIService, AIServiceResult, GenerationOptions, AIMessage } from './types'
import { DesignJSON } from '@/types'
import { ERROR_MESSAGES } from '@/constants'
import {
    NANOBANANA_STAGE_A_SYSTEM,
    NANOBANANA_STAGE_B_SYSTEM,
    createNanoBananaStageAUserPrompt,
    createNanoBananaStageBUserPrompt,
} from '@/lib/prompts'

/**
 * NanoBanana AI服务实现类
 *
 * 使用NanoBanana API进行两阶段处理：
 * 1. 分析阶段：分析输入内容，生成设计JSON
 * 2. 渲染阶段：将设计JSON转换为SVG卡片
 *
 * 与DeepSeek不同，NanoBanana使用不同的API格式和提示词模板
 *
 * @example
 * ```typescript
 * const service = new NanoBananaService(config)
 * const result = await service.process("文章内容")
 * console.log(result.svgContent, result.designJson)
 * ```
 */
export class NanoBananaService extends AIService {
    constructor(config: any) {
        super(config, 'NanoBanana')
    }

    /**
     * 处理文本内容，生成小红书卡片
     *
     * @param text 输入文本
     * @param options 生成选项
     * @returns Promise<AIServiceResult> 处理结果
     */
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
        const userPrompt = createNanoBananaStageAUserPrompt(text, opt as any)

        const messages: AIMessage[] = [
            { role: 'system', content: NANOBANANA_STAGE_A_SYSTEM },
            { role: 'user', content: [{ type: 'text', text: userPrompt }] },
        ]

        const jsonResponse = await this.callAPI(messages)
        this.logInfo('阶段A 响应获取成功', { responseLength: jsonResponse.length })

        const designJson = this.extractAndParseJson(jsonResponse)

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
        const userPrompt = createNanoBananaStageBUserPrompt(JSON.stringify(designJson), style)

        const messages: AIMessage[] = [
            { role: 'system', content: NANOBANANA_STAGE_B_SYSTEM },
            { role: 'user', content: [{ type: 'text', text: userPrompt }] },
        ]

        const svgResponse = await this.callAPI(messages)
        const svgContent = this.extractSvgContent(svgResponse)

        this.logInfo('阶段B 完成', { svgLength: svgContent.length })
        return svgContent
    }

    /**
     * 从响应中提取并解析JSON - NanoBanana特有的处理逻辑
     */
    private extractAndParseJson(response: string): DesignJSON {
        try {
            // 尝试从响应中提取JSON对象
            const jsonMatch = response.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                this.logError('未找到JSON对象', response.substring(0, 200))
                throw new Error(ERROR_MESSAGES.INVALID_JSON)
            }

            const jsonString = jsonMatch[0]
            return this.parseJsonResponse<DesignJSON>(jsonString)
        } catch (error) {
            this.logError('JSON提取和解析失败', { error, response: response.substring(0, 200) })
            throw new Error(`${ERROR_MESSAGES.INVALID_JSON}: NanoBanana响应格式错误`)
        }
    }
}
