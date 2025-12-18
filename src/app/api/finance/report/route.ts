import { NextRequest } from 'next/server'
import { proxy } from '@/lib/proxy'
import { requireAccess } from '@/interfaces/http/middleware/rbac'
import { handlePricingReport } from '@/interfaces/http/controllers/finance/ReportingController'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    if (process.env.NEXT_PUBLIC_USE_FASTIFY_API === 'true') return proxy(req, '/api/finance/report', 'POST')
    const err = requireAccess(req, 'finance_report')
    if (err) return err
    return handlePricingReport(req)
}
