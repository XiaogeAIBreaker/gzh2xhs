import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import type { ExportRequest } from '@/types/api'
import { convertBase64ToPng } from '@/lib/image-converter'
import { ERROR_MESSAGES } from '@/constants'

export async function POST(req: NextRequest) {
  try {
    const { images }: ExportRequest = await req.json()
    if (!images || images.length === 0) {
      return NextResponse.json({ error: '没有要导出的卡片' }, { status: 400 })
    }

    // 创建ZIP文件
    const zip = new JSZip()

    for (let i = 0; i < images.length; i++) {
      const item = images[i]
      try {
        const pngBuffer = await convertBase64ToPng(item.dataUrl)
        if (!pngBuffer) throw new Error(ERROR_MESSAGES.IMAGE_CONVERSION_FAILED)
        zip.file(`小红书卡片_${i + 1}.png`, pngBuffer)
      } catch (e) {
        const placeholder = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
          'base64'
        )
        zip.file(`小红书卡片_${i + 1}.png`, placeholder)
      }
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
