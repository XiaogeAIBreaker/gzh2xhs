import { AIService, AIServiceResult } from './types'
import { DesignJSON } from '@/types'
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
  async process(text: string): Promise<AIServiceResult> {
    // 阶段A：分析与设计JSON
    const stageAMessages = [
      { role: 'system', content: DEEPSEEK_STAGE_A_SYSTEM },
      { role: 'user', content: createStageAUserPrompt(text) }
    ]

    const jsonResponse = await this.callAPI(stageAMessages)
    console.log('DeepSeek Stage A 原始响应:', jsonResponse)

    let designJson: DesignJSON
    try {
      const cleanJsonResponse = this.cleanJsonResponse(jsonResponse)
      designJson = JSON.parse(cleanJsonResponse)
      console.log('DeepSeek Stage A 解析成功:', designJson)
    } catch (error) {
      console.error('DeepSeek Stage A JSON解析失败:', error)
      console.log('原始响应:', jsonResponse)
      throw new Error('DeepSeek 返回的JSON格式无效')
    }

    // 阶段B：SVG渲染
    const stageBMessages = [
      { role: 'system', content: DEEPSEEK_STAGE_B_SYSTEM },
      { role: 'user', content: createStageBUserPrompt(jsonResponse) }
    ]

    const svgResponse = await this.callAPI(stageBMessages)
    const svgContent = this.extractSvgContent(svgResponse)

    return {
      svgContent,
      designJson
    }
  }
}