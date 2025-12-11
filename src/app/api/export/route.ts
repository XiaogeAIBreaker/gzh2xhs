import { NextRequest } from 'next/server'
export const runtime = 'nodejs'
import { ExportController } from '@/interfaces/http/controllers/ExportController'
import { requireAccess } from '@/interfaces/http/middleware/rbac'

export async function POST(req: NextRequest) {
    const forbidden = requireAccess(req, 'card_export')
    if (forbidden) return forbidden
    const controller = new ExportController()
    return controller.post(req)
}
