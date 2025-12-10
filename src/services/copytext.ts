import { XIAOHONGSHU_COPYTEXT_PROMPT } from '@/lib/prompts'
import { appConfig } from '@/config'
import { logger } from '@/lib/logger'

export async function generateXiaohongshuCopytext(text: string): Promise<string> {
  const prompt = XIAOHONGSHU_COPYTEXT_PROMPT.replace('{{CONTENT}}', text)

  try {
    const response = await fetch(appConfig.ai.deepseek.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appConfig.ai.deepseek.apiKey}`,
      },
      body: JSON.stringify({
        model: appConfig.ai.deepseek.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: appConfig.ai.defaults.temperature,
        max_tokens: appConfig.ai.defaults.maxTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API 调用失败: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || '文案生成失败'

  } catch (error) {
    logger.error('文案生成失败', error, 'Copytext')
    throw new Error('文案生成失败，请重试')
  }
}
