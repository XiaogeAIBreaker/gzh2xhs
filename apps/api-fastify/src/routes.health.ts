import type { FastifyInstance } from 'fastify'

export function registerHealth(app: FastifyInstance) {
    app.get('/health', async (_req, reply) => {
        reply.code(200).send({ ok: true })
    })
}
