import type { FastifyInstance } from 'fastify'
import { summary } from '@/shared/lib/metrics'

export function registerKpi(app: FastifyInstance) {
    app.get('/api/kpi', async (_req, reply) => {
        const latency = summary('http_latency')
        reply.code(200).send({ latency })
    })
}
