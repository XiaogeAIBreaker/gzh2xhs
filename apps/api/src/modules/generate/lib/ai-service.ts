import { Logger } from '@nestjs/common'
import { AIServiceConfig, AIServiceResult, GenerationOptions, AIMessage, APIRequestConfig } from '../types'
import { ERROR_MESSAGES, APP_CONSTANTS } from '../constants'

export abstract class AIService {
    protected readonly logger: Logger
    protected readonly config: AIServiceConfig
    protected readonly serviceName: string

    constructor(config: AIServiceConfig, serviceName: string = 'AI服务') {
        this.config = config
        this.serviceName = serviceName
        this.logger = new Logger(serviceName)
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
            const timeoutMs = APP_CONSTANTS.TIMEOUTS.API_REQUEST
            const maxRetries = 2
            const req = this.buildRequest(messages)
            const out = await this.requestWithRetry(req, timeoutMs, maxRetries)
            return out
        } catch (error) {
            if (error instanceof Error) {
                // 如果已经是我们的错误，直接抛出
                if (
                    error.message.includes(ERROR_MESSAGES.API_CALL_FAILED) ||
                    error.message === ERROR_MESSAGES.API_EMPTY_RESPONSE
                ) {
                    throw error
                }
            }

            // 网络或其他未知错误
            this.logError('API调用异常', error)
            throw new Error(`${this.serviceName} ${ERROR_MESSAGES.NETWORK_ERROR}`)
        }
    }

    private buildRequest(messages: AIMessage[]): APIRequestConfig {
        return {
            model: this.config.model,
            messages,
            temperature: 0.7, // Default temperature
            max_tokens: 4000, // Default max tokens
        }
    }

    private async doRequest(config: APIRequestConfig, timeoutMs: number): Promise<string> {
        const ac = new AbortController()
        const timer = setTimeout(() => ac.abort(), timeoutMs)
        try {
            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.config.apiKey}`,
                },
                body: JSON.stringify(config),
                signal: ac.signal,
            })
            clearTimeout(timer)
            if (!response.ok) {
                const errorText = await response.text()
                this.logError(`API调用失败 [${response.status}]`, { errorText })
                throw new Error(`${ERROR_MESSAGES.API_CALL_FAILED}: ${response.status}`)
            }
            const data = await response.json() as any
            const content = data.choices?.[0]?.message?.content
            if (!content) {
                this.logError('API返回空内容', data)
                throw new Error(ERROR_MESSAGES.API_EMPTY_RESPONSE)
            }
            return content
        } catch (e) {
            clearTimeout(timer)
            throw e
        }
    }

    private async requestWithRetry(
        config: APIRequestConfig,
        timeoutMs: number,
        maxRetries: number,
    ) {
        let attempt = 0
        let lastErr: any = null
        while (attempt <= maxRetries) {
            try {
                return await this.doRequest(config, timeoutMs)
            } catch (e) {
                lastErr = e
            }
            attempt += 1
            if (attempt <= maxRetries) await this.delay(Math.min(1000 * attempt, 3000))
        }
        throw lastErr || new Error(ERROR_MESSAGES.NETWORK_ERROR)
    }

    private async delay(ms: number) {
        return new Promise((r) => setTimeout(r, ms))
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
            { start: '`', end: '`' },
        ]

        for (const pattern of codeBlockPatterns) {
            if (cleanResponse.startsWith(pattern.start) && cleanResponse.endsWith(pattern.end)) {
                cleanResponse = cleanResponse
                    .slice(pattern.start.length, -pattern.end.length)
                    .trim()
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
        if (svgContent.length < APP_CONSTANTS.MIN_SVG_CONTENT_LENGTH) {
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
        this.logger.error(message, details)
    }

    /**
     * 记录信息日志
     *
     * @param message 信息消息
     * @param details 详情
     */
    protected logInfo(message: string, details?: any): void {
        this.logger.log(message, details)
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
