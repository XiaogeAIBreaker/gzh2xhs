import { DesignJSON } from '@/types'

/**
 * AI服务处理结果接口
 */
export interface AIServiceResult {
  /** 生成的SVG内容 */
  svgContent: string
  /** 设计配置JSON */
  designJson: DesignJSON
}

/**
 * AI服务配置接口
 */
export interface AIServiceConfig {
  /** API密钥 */
  apiKey: string
  /** API服务地址 */
  apiUrl: string
  /** 模型名称 */
  model: string
}

/**
 * AI服务抽象基类
 *
 * 提供统一的AI服务接口，所有AI服务都应继承此类
 * 包含通用的API调用、JSON清理、SVG提取等功能
 */
export abstract class AIService {
  protected config: AIServiceConfig

  constructor(config: AIServiceConfig) {
    this.config = config
  }

  /**
   * 处理输入文本，生成小红书卡片
   *
   * @param text 输入的文本内容
   * @returns Promise<AIServiceResult> 包含SVG内容和设计JSON的结果
   * @throws Error 当AI处理失败时抛出错误
   */
  abstract process(text: string): Promise<AIServiceResult>

  /**
   * 调用AI API
   *
   * @param messages 消息数组，包含对话历史
   * @returns Promise<string> API返回的内容
   * @throws Error 当API调用失败时抛出错误
   */
  protected async callAPI(messages: Array<{ role: string; content: string | Array<{ type: string; text: string }> }>): Promise<string> {
    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('API返回空内容')
    }

    return content
  }

  /**
   * 清理JSON响应内容，移除markdown包装
   *
   * @param jsonResponse AI返回的JSON字符串（可能包含```json包装）
   * @returns 清理后的纯JSON字符串
   */
  protected cleanJsonResponse(jsonResponse: string): string {
    let cleanResponse = jsonResponse.trim()
    if (cleanResponse.startsWith('```json') && cleanResponse.endsWith('```')) {
      cleanResponse = cleanResponse.slice(7, -3).trim()
    } else if (cleanResponse.startsWith('```') && cleanResponse.endsWith('```')) {
      cleanResponse = cleanResponse.slice(3, -3).trim()
    }
    return cleanResponse
  }

  /**
   * 从AI响应中提取SVG内容
   *
   * @param svgResponse AI返回的包含SVG的字符串
   * @returns 提取并清理后的SVG内容
   * @throws Error 当未找到有效SVG时抛出错误
   */
  protected extractSvgContent(svgResponse: string): string {
    const svgMatch = svgResponse.match(/<svg[\s\S]*?<\/svg>/i)
    if (!svgMatch) {
      throw new Error('未返回有效的SVG内容')
    }
    return this.cleanSvgContent(svgMatch[0])
  }

  /**
   * 清理SVG内容，移除多余字符和命名空间
   *
   * @param svgContent 原始SVG内容
   * @returns 清理后的SVG内容
   */
  protected cleanSvgContent(svgContent: string): string {
    return svgContent
      .replace(/^.*?(?=<svg)/i, '') // 移除SVG前的内容
      .replace(/<\/svg>.*$/i, '</svg>') // 移除SVG后的内容
      .replace(/xmlns:xlink="[^"]*"/g, '') // 移除可能导致问题的命名空间
      .replace(/\s+/g, ' ') // 规范化空白字符
      .trim()
  }
}