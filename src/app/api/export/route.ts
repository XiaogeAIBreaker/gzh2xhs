import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

export async function POST(req: NextRequest) {
  try {
    const { cardIds }: { cardIds: string[] } = await req.json()

    if (!cardIds || cardIds.length === 0) {
      return NextResponse.json(
        { error: '没有要导出的卡片' },
        { status: 400 }
      )
    }

    // 创建ZIP文件
    const zip = new JSZip()

    // 这里需要从临时存储或缓存中获取图片数据
    // 在实际应用中，可能需要从数据库或文件系统中获取
    // 目前简化处理，假设从前端传递的imageUrl中提取base64数据

    for (let i = 0; i < cardIds.length; i++) {
      // 这里应该根据cardId获取对应的图片数据
      // 简化处理：创建一个占位图片
      const placeholderImage = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64'
      )

      zip.file(`小红书卡片_${i + 1}.png`, placeholderImage)
    }

    // 生成ZIP文件
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // 返回ZIP文件
    return new Response(zipBuffer as unknown as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="xiaohongshu-cards-${Date.now()}.zip"`,
      },
    })

  } catch (error) {
    console.error('导出失败:', error)
    return NextResponse.json(
      { error: '导出失败，请重试' },
      { status: 500 }
    )
  }
}