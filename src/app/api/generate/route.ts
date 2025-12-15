import { NextRequest } from 'next/server'
export const runtime = 'nodejs'
import { GenerateController } from '@/interfaces/http/controllers/GenerateController'
import { requireAccess } from '@/interfaces/http/middleware/rbac'
import { withValidation } from '@/interfaces/http/middleware/withValidation'
import { GenerateRequestSchema } from '@/types/schemas'

export async function POST(req: NextRequest) {
    const forbidden = requireAccess(req, 'card_generate')
    if (forbidden) return forbidden
    const controller = new GenerateController()
    const handler = withValidation(GenerateRequestSchema, (r, body) =>
        controller.postValidated(r, body),
    )
    return handler(req)
}
