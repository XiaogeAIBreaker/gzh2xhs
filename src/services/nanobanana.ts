import { AIService, AIServiceResult } from './types'
import { DesignJSON } from '@/types'
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
  async process(text: string): Promise<AIServiceResult> {
    // 阶段A：分析与设计JSON
    const stageAPrompt = createNanoBananaStageAUserPrompt(text)

    console.log('Nano Banana Stage A 开始...')
    const jsonResponse = await this.callAPI([
      { role: 'system', content: NANOBANANA_STAGE_A_SYSTEM },
      { role: 'user', content: [{ type: 'text', text: stageAPrompt }] }
    ])

    let designJson: DesignJSON
    try {
      // 尝试从响应中提取JSON
      const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : jsonResponse
      designJson = JSON.parse(jsonString)
      console.log('Nano Banana Stage A 成功，模板类型:', designJson.template_type)
    } catch (error) {
      console.log('Nano Banana Stage A JSON 解析失败')
      throw new Error('Nano Banana Stage A JSON 解析失败')
    }

    // 阶段B：SVG渲染
    const stageBPrompt = createNanoBananaStageBUserPrompt(JSON.stringify(designJson))

    console.log('Nano Banana Stage B 开始...')
    const svgResponse = await this.callAPI([
      { role: 'system', content: NANOBANANA_STAGE_B_SYSTEM },
      { role: 'user', content: [{ type: 'text', text: stageBPrompt }] }
    ])

    const svgContent = this.extractSvgContent(svgResponse)
    console.log('Nano Banana 两步法成功完成')

    return {
      svgContent,
      designJson
    }
  }
}