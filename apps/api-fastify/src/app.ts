import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { config as loadEnv } from 'dotenv'
import { createRequestContainer } from '@/container'
import { jsonErrorFromAppError } from '@/lib/http'
import { logger as webLogger } from '@/lib/logger'
import { observe } from '@/shared/lib/metrics'

loadEnv()

export function buildApp() {
    const app = Fastify({ logger: { level: 'info' } })

    app.register(cors, { origin: true })
    app.register(helmet)
    app.register(rateLimit, { max: 60, timeWindow: '1 minute' })

    app.addHook('onRequest', async (req, _reply) => {
        const rid = req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).slice(2)}`
        req.headers['x-request-id'] = String(rid)
        ;(req as any).container = createRequestContainer({ requestId: String(rid), ip: req.ip })
        ;(req as any)._start = Date.now()
    })

    app.setErrorHandler((err, req, reply) => {
        const rid = String(req.headers['x-request-id'] || '')
        try {
            const res = jsonErrorFromAppError(err as any, rid)
            const body = (res as any).body ?? (res as any)._body ?? { code: 'INTERNAL_ERROR', message: 'error' }
            const status = (res as any).status ?? 500
            reply.code(status).type('application/json').send(body)
        } catch (_e) {
            reply.code(500).type('application/json').send({ code: 'INTERNAL_ERROR', message: 'server error', traceId: rid })
        }
    })

    app.addHook('onResponse', async (req, reply) => {
        const rid = String(req.headers['x-request-id'] || '')
        const start = (req as any)._start || Date.now()
        const dur = Date.now() - start
        observe('http_latency', dur, { path: req.url, status: reply.statusCode })
        webLogger.withContext({ traceId: rid }).info({ event: 'http_response', status: reply.statusCode, path: req.url })
    })

    return app
}
