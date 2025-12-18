import type { FastifyInstance } from 'fastify'
import { ExportImagesUseCase } from '@/application/usecases/ExportImagesUseCase'
import { createHash } from 'crypto'

export function registerExport(app: FastifyInstance) {
    app.post('/api/export', async (req, reply) => {
        const body = req.body as any
        const container = (req as any).container
        const usecase = new ExportImagesUseCase(container)
        const zip = await usecase.execute({ images: body?.images || [], namePrefix: body?.namePrefix })
        const etag = createHash('sha1').update(zip).digest('hex')
        reply
            .code(200)
            .headers({ ETag: etag, 'Cache-Control': 'no-cache', 'Content-Disposition': 'attachment; filename="export.zip"' })
            .type('application/zip')
            .send(zip)
    })
}
