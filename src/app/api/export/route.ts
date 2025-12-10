import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import JSZip from 'jszip'
import type { ExportRequest } from '@/types/api'
import { convertBase64ToPng } from '@/lib/image-converter'
import { ERROR_MESSAGES } from '@/constants'
import { z } from 'zod'
import { jsonError } from '@/lib/http'
import { logger } from '@/lib/logger'
import { appConfig } from '@/config'
import { createRateLimiter } from '@/lib/rateLimiter'

const ExportSchema = z.object({
  images: z.array(z.object({ dataUrl: z.string().min(1), id: z.string().optional() })).min(1),
})

const limiter = createRateLimiter(appConfig.features.rateLimit)

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const allowed = await limiter.allow(`export:${ip}`)
    if (!allowed) {
      return jsonError('请求过于频繁，请稍后重试', 429)
    }

    const body: ExportRequest = await req.json()
    const parsed = ExportSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError('没有要导出的卡片', 400)
    }
    const { images } = parsed.data

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
    logger.error('导出失败', error, 'Export')
    return jsonError('导出失败，请重试', 500)
  }
}
