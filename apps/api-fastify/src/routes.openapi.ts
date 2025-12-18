import type { FastifyInstance } from 'fastify'
import { generateOpenApiDocument } from '@/docs/openapi'

export function registerOpenapi(app: FastifyInstance) {
    app.get('/api/openapi', async (_req, reply) => {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || undefined
        const doc = generateOpenApiDocument(baseUrl as any)
        reply.code(200).send(doc)
    })
}
