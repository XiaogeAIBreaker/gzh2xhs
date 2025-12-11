import { NextRequest } from 'next/server'
import { requireAccess } from '@/interfaces/http/middleware/rbac'
import { handlePricingReport } from '@/interfaces/http/controllers/finance/ReportingController'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    const err = requireAccess(req, 'finance_report')
    if (err) return err
    return handlePricingReport(req)
}
