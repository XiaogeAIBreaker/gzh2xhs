import { NextRequest } from 'next/server'
import { z } from 'zod'
import { jsonError } from '@/lib/http'
import { logger } from '@/lib/logger'
import { ExportImagesUseCase } from '@/application/usecases/ExportImagesUseCase'

const ExportSchema = z.object({
  images: z.array(z.object({ dataUrl: z.string().min(1), id: z.string().optional() })).min(1),
  namePrefix: z.string().optional(),
})

export class ExportController {
  async post(req: NextRequest): Promise<Response> {
    try {
      const body: unknown = await req.json()
      const parsed = ExportSchema.safeParse(body)
      if (!parsed.success) {
        return jsonError('没有要导出的卡片', 400)
      }
      const uc = new ExportImagesUseCase()
      const zipBuffer = await uc.execute(parsed.data as any)
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
}
