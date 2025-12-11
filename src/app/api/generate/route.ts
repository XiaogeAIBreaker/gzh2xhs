import { NextRequest } from 'next/server'
export const runtime = 'nodejs'
import { GenerateController } from '@/interfaces/http/controllers/GenerateController'
import { requireAccess } from '@/interfaces/http/middleware/rbac'

export async function POST(req: NextRequest) {
    const forbidden = requireAccess(req, 'card_generate')
    if (forbidden) return forbidden
    const controller = new GenerateController()
    return controller.post(req)
}
