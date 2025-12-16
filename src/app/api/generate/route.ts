import { NextRequest } from 'next/server'
export const runtime = 'nodejs'
import { GenerateController } from '@/interfaces/http/controllers/GenerateController'
import { requireAccess } from '@/interfaces/http/middleware/rbac'
import { withValidation } from '@/interfaces/http/middleware/withValidation'
import { withRateLimit, enforceIdempotency } from '@/interfaces/http/middleware/limits'
import { GenerateRequestSchema } from '@/types/schemas'

export async function POST(req: NextRequest) {
    const forbidden = requireAccess(req, 'card_generate')
    if (forbidden) return forbidden
    const idem = await enforceIdempotency(req)
    if (idem) return idem
    const controller = new GenerateController()
    const validated = withValidation(GenerateRequestSchema, (r, body) =>
        controller.postValidated(r, body),
    )
    const handler = withRateLimit(validated)
    return handler(req)
}
