import { NextRequest } from 'next/server'
export const runtime = 'nodejs'
import { proxy } from '@/lib/proxy'
import { GenerateController } from '@/interfaces/http/controllers/GenerateController'
import { requireAccess } from '@/interfaces/http/middleware/rbac'
import { withValidation } from '@/interfaces/http/middleware/withValidation'
import { withRateLimit, enforceIdempotency } from '@/interfaces/http/middleware/limits'
import { GenerateRequestSchema } from '@/types/schemas'

export async function POST(req: NextRequest) {
    if (process.env.NEXT_PUBLIC_USE_FASTIFY_API === 'true') return proxy(req, '/api/generate', 'POST')
    const forbidden = requireAccess(req, 'card_generate')
    if (forbidden) return forbidden
    const idem = await enforceIdempotency(req)
    if (idem) return idem
    const controller = new GenerateController()
    const validated = withValidation(GenerateRequestSchema, (r, body) => controller.postValidated(r, body))
    const handler = withRateLimit(validated)
    return handler(req)
}
