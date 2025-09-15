import { AIService, AIServiceResult, GenerationOptions, AIMessage } from './types'
import { DesignJSON } from '@/types'
import { ERROR_MESSAGES } from '@/constants'
import {
  DEEPSEEK_STAGE_A_SYSTEM,
  DEEPSEEK_STAGE_B_SYSTEM,
  createStageAUserPrompt,
  createStageBUserPrompt,
} from '@/lib/prompts'

/**
 * DeepSeek AI服务实现类
 *
 * 使用DeepSeek API进行两阶段处理：
 * 1. 分析阶段：分析输入内容，生成设计JSON
 * 2. 渲染阶段：将设计JSON转换为SVG卡片
 *
 * @example
 * ```typescript
 * const service = new DeepSeekService(config)
 * const result = await service.process("文章内容")
 * console.log(result.svgContent, result.designJson)
 * ```
 */
export class DeepSeekService extends AIService {
  constructor(config: any) {
    super(config, 'DeepSeek')
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
        svgLength: svgContent.length
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

    const messages: AIMessage[] = [
      { role: 'system', content: DEEPSEEK_STAGE_A_SYSTEM },
      { role: 'user', content: createStageAUserPrompt(text, { styleChoice: options?.styleChoice }) }
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
  private async executeStageB(designJson: DesignJSON, options?: GenerationOptions): Promise<string> {
    this.logInfo('开始阶段B - SVG渲染')

    const messages: AIMessage[] = [
      { role: 'system', content: DEEPSEEK_STAGE_B_SYSTEM },
      { role: 'user', content: createStageBUserPrompt(JSON.stringify(designJson), options?.styleChoice) }
    ]

    const svgResponse = await this.callAPI(messages)
    const svgContent = this.extractSvgContent(svgResponse)

    this.logInfo('阶段B 完成', { svgLength: svgContent.length })
    return svgContent
  }
}