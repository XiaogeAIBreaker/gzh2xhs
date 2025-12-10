import { DeepSeekService } from './deepseek'
import { NanoBananaService } from './nanobanana'
import { AIModel } from '@/types'
import { appConfig } from '@/config'

export * from './types'
export { DeepSeekService } from './deepseek'
export { NanoBananaService } from './nanobanana'

/**
 * AI服务工厂函数
 *
 * 根据指定的模型类型创建对应的AI服务实例
 * 自动从配置中获取相应的API密钥和服务地址
 *
 * @param model AI模型类型 ('deepseek' | 'nanobanana')
 * @returns 对应的AI服务实例
 * @throws Error 当模型类型不支持时抛出错误
 *
 * @example
 * ```typescript
 * // 创建DeepSeek服务
 * const deepseekService = createAIService('deepseek')
 * const result = await deepseekService.process("文章内容")
 *
 * // 创建NanoBanana服务
 * const nanobananaService = createAIService('nanobanana')
 * const result = await nanobananaService.process("文章内容")
 * ```
 */
export function createAIService(model: AIModel) {
  switch (model) {
    case 'deepseek':
      return new DeepSeekService({
        apiKey: appConfig.ai.deepseek.apiKey,
        apiUrl: appConfig.ai.deepseek.apiUrl,
        model: appConfig.ai.deepseek.model,
      })
    case 'nanobanana':
      return new NanoBananaService({
        apiKey: appConfig.ai.nanobanana.apiKey,
        apiUrl: appConfig.ai.nanobanana.apiUrl,
        model: appConfig.ai.nanobanana.model,
      })
    default:
      throw new Error(`不支持的AI模型: ${model}`)
  }
}
