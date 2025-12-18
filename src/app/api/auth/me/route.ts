import { NextRequest } from 'next/server'
import { proxy } from '@/lib/proxy'
import { jsonOk, jsonError } from '@/lib/http'
import { parseAuth } from '@/interfaces/http/middleware/auth'
import { userRepo } from '@/infrastructure/repositories/UserRepository'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    if (process.env.NEXT_PUBLIC_USE_FASTIFY_API === 'true') return proxy(req, '/api/auth/me', 'GET')
    const auth = parseAuth(req)
    if (!auth) return jsonError('FORBIDDEN', '未登录', 403)
    const email = auth.id === 'admin' ? 'admin@example.com' : 'user@example.com'
    const user = (await userRepo.findByEmail(email)) || { id: auth.id, email, role: auth.role }
    return jsonOk({ success: true, user })
}
