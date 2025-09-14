import { NextRequest, NextResponse } from 'next/server'
import { createAIService } from '@/services'
import { generateXiaohongshuCopytext } from '@/services/copytext'
import { convertSvgToPng, createTempImageUrl } from '@/lib/image-converter'
import { AIModel, GeneratedCard } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { text, model }: { text: string; model: AIModel } = await req.json()

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: '请输入要转换的内容' },
        { status: 400 }
      )
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { error: '内容长度不能超过2000字' },
        { status: 400 }
      )
    }

    const cards: GeneratedCard[] = []
    let copytext = ''

    // 生成小红书文案
    try {
      copytext = await generateXiaohongshuCopytext(text)
    } catch (error) {
      console.error('文案生成失败:', error)
      copytext = '文案生成失败，请重试'
    }

    // 创建AI服务并处理 - 不再有降级逻辑
    try {
      const aiService = createAIService(model)
      const { svgContent, designJson } = await aiService.process(text)

      // 验证返回的SVG内容
      if (!svgContent || svgContent.length < 100) {
        throw new Error('返回的SVG内容太小或无效')
      }

      const pngBuffer = await convertSvgToPng(svgContent)
      const imageUrl = createTempImageUrl(pngBuffer, `${model}-card.png`)

      cards.push({
        id: `${model}-${Date.now()}`,
        imageUrl,
        template: designJson.template_type || 'Unknown',
        model
      })

    } catch (error) {
      console.error(`${model} 处理失败:`, error)
      return NextResponse.json(
        {
          error: `${model === 'deepseek' ? 'DeepSeek' : 'Nano Banana'} 处理失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: '请检查网络连接和API配置'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      cards,
      copytext,
      success: true
    })

  } catch (error) {
    console.error('API 处理失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误，请重试' },
      { status: 500 }
    )
  }
}