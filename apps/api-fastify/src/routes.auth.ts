import type { FastifyInstance } from 'fastify'
import { userRepo } from '@/infrastructure/repositories/UserRepository'

export function registerAuth(app: FastifyInstance) {
    app.post('/api/auth/register', async (req, reply) => {
        const body = req.body as any
        const user = await userRepo.create(String(body?.email || ''), String(body?.password || ''), 'user')
        reply.code(200).send({ id: user.id })
    })
    app.post('/api/auth/login', async (req, reply) => {
        const body = req.body as any
        const user = await userRepo.verify(String(body?.email || ''), String(body?.password || ''))
        if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'invalid credentials' })
        const token = user.role === 'admin' ? 'admin-token' : 'user-token'
        reply.code(200).send({ token })
    })
    app.get('/api/auth/me', async (req, reply) => {
        const auth = String(req.headers['authorization'] || '')
        const role = auth.includes('admin-token') ? 'admin' : 'user'
        reply.code(200).send({ id: 'user', role })
    })
}
