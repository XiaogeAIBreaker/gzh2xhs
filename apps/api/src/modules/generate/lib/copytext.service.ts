import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { XIAOHONGSHU_COPYTEXT_PROMPT } from './prompts'

@Injectable()
export class CopytextService {
    private readonly logger = new Logger('CopytextService')

    constructor(private readonly config: ConfigService) {}

    async generate(text: string): Promise<string> {
        const prompt = XIAOHONGSHU_COPYTEXT_PROMPT.replace('{{CONTENT}}', text)
        const apiKey = this.config.get('DEEPSEEK_API_KEY')
        const apiUrl = this.config.get('DEEPSEEK_API_URL') || 'https://api.deepseek.com/chat/completions'
        const model = 'deepseek-chat'

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 4000,
                }),
            })

            if (!response.ok) {
                throw new Error(`DeepSeek API 调用失败: ${response.status}`)
            }

            const data = await response.json() as any
            return data.choices[0]?.message?.content || '文案生成失败'
        } catch (error) {
            this.logger.error('文案生成失败', error)
            // Non-blocking error usually, but here we throw?
            // Next.js version threw '文案生成失败，请重试'
            return '文案生成失败，请重试'
        }
    }
}
