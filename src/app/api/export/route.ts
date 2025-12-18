import { NextRequest } from 'next/server'
export const runtime = 'nodejs'
import { proxy } from '@/lib/proxy'
import { ExportController } from '@/interfaces/http/controllers/ExportController'
import { requireAccess } from '@/interfaces/http/middleware/rbac'
import { withRateLimit, enforceIdempotency } from '@/interfaces/http/middleware/limits'

export async function POST(req: NextRequest) {
    if (process.env.NEXT_PUBLIC_USE_FASTIFY_API === 'true') return proxy(req, '/api/export', 'POST')
    const forbidden = requireAccess(req, 'card_export')
    if (forbidden) return forbidden
    const idem = await enforceIdempotency(req)
    if (idem) return idem
    const controller = new ExportController()
    const handler = withRateLimit((r) => controller.post(r))
    return handler(req)
}
