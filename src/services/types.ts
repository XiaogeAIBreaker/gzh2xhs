import { DesignJSON } from '@/types'
import { API_CONFIG, ERROR_MESSAGES } from '@/constants'

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
 * 生成选项接口 - 统一的生成参数定义
 */
export interface GenerationOptions {
  /** 用户选择的款式：simple(信息少)/standard(中)/rich(多) */
  styleChoice?: 'simple' | 'standard' | 'rich'
  /** 主要颜色 */
  mainColor?: string
  /** 强调颜色 */
  accentColor?: string
  /** 目标受众 */
  audience?: string
  /** 内容意图 */
  intent?: string
}

/**
 * API消息接口
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: string; text: string }>
}

/**
 * API请求配置
 */
export interface APIRequestConfig {
  model: string
  messages: AIMessage[]
  temperature: number
  max_tokens: number
}

/**
 * AI服务抽象基类
 *
 * 提供统一的AI服务接口，所有AI服务都应继承此类
 * 包含通用的API调用、JSON清理、SVG提取等功能
 */
export abstract class AIService {
  protected readonly config: AIServiceConfig
  protected readonly serviceName: string

  constructor(config: AIServiceConfig, serviceName: string = 'AI服务') {
    this.config = config
    this.serviceName = serviceName
  }

  /**
   * 处理输入文本，生成小红书卡片
   *
   * @param text 输入的文本内容
   * @param options 生成选项
   * @returns Promise<AIServiceResult> 包含SVG内容和设计JSON的结果
   * @throws Error 当AI处理失败时抛出错误
   */
  abstract process(text: string, options?: GenerationOptions): Promise<AIServiceResult>

  /**
   * 调用AI API
   *
   * @param messages 消息数组，包含对话历史
   * @returns Promise<string> API返回的内容
   * @throws Error 当API调用失败时抛出错误
   */
  protected async callAPI(messages: AIMessage[]): Promise<string> {
    try {
      const requestConfig: APIRequestConfig = {
        model: this.config.model,
        messages,
        temperature: API_CONFIG.DEFAULT_TEMPERATURE,
        max_tokens: API_CONFIG.DEFAULT_MAX_TOKENS,
      }

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestConfig),
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.logError(`API调用失败 [${response.status}]: ${errorText}`)
        throw new Error(`${ERROR_MESSAGES.API_CALL_FAILED}: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        this.logError('API返回空内容', data)
        throw new Error(ERROR_MESSAGES.API_EMPTY_RESPONSE)
      }

      return content
    } catch (error) {
      if (error instanceof Error) {
        // 如果已经是我们的错误，直接抛出
        if (error.message.includes(ERROR_MESSAGES.API_CALL_FAILED) ||
            error.message === ERROR_MESSAGES.API_EMPTY_RESPONSE) {
          throw error
        }
      }

      // 网络或其他未知错误
      this.logError('API调用异常', error)
      throw new Error(`${this.serviceName} ${ERROR_MESSAGES.NETWORK_ERROR}`)
    }
  }

  /**
   * 清理JSON响应内容，移除markdown包装
   *
   * @param jsonResponse AI返回的JSON字符串（可能包含```json包装）
   * @returns 清理后的纯JSON字符串
   */
  protected cleanJsonResponse(jsonResponse: string): string {
    if (!jsonResponse?.trim()) {
      throw new Error(ERROR_MESSAGES.API_EMPTY_RESPONSE)
    }

    let cleanResponse = jsonResponse.trim()

    // 移除markdown代码块包装
    const codeBlockPatterns = [
      { start: '```json', end: '```' },
      { start: '```', end: '```' },
      { start: '`', end: '`' }
    ]

    for (const pattern of codeBlockPatterns) {
      if (cleanResponse.startsWith(pattern.start) && cleanResponse.endsWith(pattern.end)) {
        cleanResponse = cleanResponse.slice(pattern.start.length, -pattern.end.length).trim()
        break
      }
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
    if (!svgResponse?.trim()) {
      this.logError('SVG响应为空')
      throw new Error(ERROR_MESSAGES.INVALID_SVG)
    }

    const svgMatch = svgResponse.match(/<svg[\s\S]*?<\/svg>/i)
    if (!svgMatch) {
      this.logError('未找到SVG标签', svgResponse.substring(0, 200))
      throw new Error(ERROR_MESSAGES.INVALID_SVG)
    }

    const svgContent = this.cleanSvgContent(svgMatch[0])

    // 验证SVG内容长度
    if (svgContent.length < 100) {
      this.logError('SVG内容过短', { length: svgContent.length, content: svgContent })
      throw new Error(ERROR_MESSAGES.SVG_TOO_SMALL)
    }

    return svgContent
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

  /**
   * 记录错误信息
   *
   * @param message 错误消息
   * @param details 错误详情
   */
  protected logError(message: string, details?: any): void {
    console.error(`[${this.serviceName}] ${message}`, details || '')
  }

  /**
   * 记录信息日志
   *
   * @param message 信息消息
   * @param details 详情
   */
  protected logInfo(message: string, details?: any): void {
    console.log(`[${this.serviceName}] ${message}`, details || '')
  }

  /**
   * 解析JSON响应
   *
   * @param jsonString JSON字符串
   * @returns 解析后的对象
   * @throws Error 当JSON解析失败时抛出错误
   */
  protected parseJsonResponse<T = any>(jsonString: string): T {
    try {
      return JSON.parse(jsonString)
    } catch (error) {
      this.logError('JSON解析失败', { jsonString: jsonString.substring(0, 200), error })
      throw new Error(`${this.serviceName} ${ERROR_MESSAGES.INVALID_JSON}`)
    }
  }
}