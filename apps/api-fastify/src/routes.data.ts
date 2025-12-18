import type { FastifyInstance } from 'fastify'
import { dataRepo } from '@/infrastructure/repositories/DataRepository'

export function registerData(app: FastifyInstance) {
    app.get('/api/data', async (req, reply) => {
        const q = (req.query as any)?.q || ''
        const type = (req.query as any)?.type || ''
        const page = Number((req.query as any)?.page || 1)
        const size = Number((req.query as any)?.size || 20)
        const items = await dataRepo.list(String(type), { q: String(q), page, size })
        reply.code(200).send({ items })
    })
    app.post('/api/data', async (req, reply) => {
        const body = req.body as any
        const item = await dataRepo.create(String(body?.type || ''), body?.item || {})
        reply.code(200).send({ item })
    })
    app.put('/api/data', async (req, reply) => {
        const body = req.body as any
        const next = await dataRepo.update(String(body?.type || ''), String(body?.id || ''), body?.patch || {})
        reply.code(200).send({ item: next })
    })
    app.delete('/api/data', async (req, reply) => {
        const type = (req.query as any)?.type || ''
        const id = (req.query as any)?.id || ''
        const ok = await dataRepo.delete(String(type), String(id))
        reply.code(200).send({ success: ok })
    })
}
