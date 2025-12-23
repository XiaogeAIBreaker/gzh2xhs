import { NextRequest } from 'next/server'
import { appConfig } from '@/config'
import { jsonError, binaryOkWithETag } from '@/lib/http'
import { logger } from '@/lib/logger'
import { ExportImagesUseCase } from '@/application/usecases/ExportImagesUseCase'
import { ExportRequestSchema } from '@/types/schemas'
import { trackServer } from '@/shared/lib/analytics'
import { createRateLimiter } from '@/shared/lib/rateLimiter'
import { cacheGet, cacheSet, makeKey } from '@/shared/lib/cache'

/**
 * 导出控制器：处理将已生成的卡片批量打包为ZIP下载。
 * - 支持幂等（`x-idempotency-key`）与速率限制
 * - 使用 ETag 与缓存头优化重复下载
 */
export class ExportController {
    /**
     *
     */
    async post(req: NextRequest): Promise<Response> {
        try {
            const traceId = req.headers.get('x-request-id') || undefined
            const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || '0.0.0.0'
            const idemKey = req.headers.get('x-idempotency-key') || undefined
            const limiter = createRateLimiter({ windowMs: 60_000, max: 30 })
            const allowed = await limiter.allow(makeKey(['export', ip]))
            if (!allowed)
                return jsonError('RATE_LIMITED', '访问过于频繁', 429, undefined, undefined, traceId)

            if (idemKey) {
                const cached = cacheGet<ArrayBuffer>(makeKey(['export', idemKey]))
                if (cached)
                    return binaryOkWithETag(req, cached, 200, {
                        'Content-Type': 'application/zip',
                        'Content-Disposition': `attachment; filename="xiaohongshu-cards-${Date.now()}.zip"`,
                    })
            }
            const body: unknown = await req.json()
            const parsed = ExportRequestSchema.safeParse(body)
            if (!parsed.success) {
                return jsonError(
                    'VALIDATION_ERROR',
                    '没有要导出的卡片',
                    400,
                    undefined,
                    undefined,
                    traceId,
                )
            }
            const uc = new ExportImagesUseCase()
            const zipBuffer = await uc.execute(parsed.data as any)
            trackServer(req as any, 'export_zip')
            if (idemKey)
                cacheSet(
                    makeKey(['export', idemKey]),
                    zipBuffer as any,
                    appConfig.features.caching.readTtlMs,
                )
            return binaryOkWithETag(req, zipBuffer as any, 200, {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="xiaohongshu-cards-${Date.now()}\.zip"`,
            })
        } catch (error) {
            logger.error('导出失败', error, 'Export', req.headers.get('x-request-id') || undefined)
            trackServer(req as any, 'export_fail', { reason: 'export_error' })
            const traceId = req.headers.get('x-request-id') || undefined
            return jsonError('EXPORT_ERROR', '导出失败，请重试', 500, undefined, undefined, traceId)
        }
    }
}
