import type { FastifyInstance } from 'fastify'
import { GenerateCardUseCase } from '@/application/usecases/GenerateCardUseCase'

export function registerGenerate(app: FastifyInstance) {
    app.post('/api/generate', async (req, reply) => {
        const body = req.body as any
        const container = (req as any).container
        const usecase = new GenerateCardUseCase(container)
        const res = await usecase.execute({ text: body?.text, model: body?.model, style: body?.style, size: body?.size })
        reply.code(200).send(res)
    })
}
