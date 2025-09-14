import { XIAOHONGSHU_COPYTEXT_PROMPT } from '@/lib/prompts'
import { config } from '@/lib/config'

export async function generateXiaohongshuCopytext(text: string): Promise<string> {
  const prompt = XIAOHONGSHU_COPYTEXT_PROMPT.replace('{{CONTENT}}', text)

  try {
    const response = await fetch(config.deepseek.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.deepseek.apiKey}`,
      },
      body: JSON.stringify({
        model: config.deepseek.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
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