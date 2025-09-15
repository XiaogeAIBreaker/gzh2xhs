import { XIAOHONGSHU_COPYTEXT_PROMPT } from '@/lib/prompts'
import { API_CONFIG } from '@/constants'

export async function generateXiaohongshuCopytext(text: string): Promise<string> {
  const prompt = XIAOHONGSHU_COPYTEXT_PROMPT.replace('{{CONTENT}}', text)

  try {
    const response = await fetch(API_CONFIG.DEEPSEEK.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.DEEPSEEK.API_KEY}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.DEEPSEEK.MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: API_CONFIG.DEFAULT_TEMPERATURE,
        max_tokens: API_CONFIG.DEFAULT_MAX_TOKENS,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API 调用失败: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || '文案生成失败'

  } catch (error) {
    console.error('文案生成失败:', error)
    throw new Error('文案生成失败，请重试')
  }
}