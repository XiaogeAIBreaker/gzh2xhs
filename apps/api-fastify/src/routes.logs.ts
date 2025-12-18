import type { FastifyInstance } from 'fastify'
import { queryLogs } from '@/shared/lib/oplog'

export function registerLogs(app: FastifyInstance) {
    app.get('/api/logs', async (req, reply) => {
        const q = (req.query as any)?.q || ''
        const limit = Number((req.query as any)?.limit || 200)
        const items = queryLogs({ q: String(q), limit })
        reply.code(200).send({ items })
    })
}
