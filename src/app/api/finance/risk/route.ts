import { NextRequest } from 'next/server'
import { requireAccess } from '@/interfaces/http/middleware/rbac'
import {
    handleVarGaussian,
    handleEquityExposure,
    handleBondDuration,
    handleOptionGreeks,
} from '@/interfaces/http/controllers/finance/RiskController'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    const err = requireAccess(req, 'finance_risk')
    if (err) return err
    const action = (req.nextUrl.searchParams.get('action') || '').trim()
    if (action === 'var') return handleVarGaussian(req)
    if (action === 'exposure') return handleEquityExposure(req)
    if (action === 'duration') return handleBondDuration(req)
    if (action === 'greeks') return handleOptionGreeks(req)
    return new Response('Bad Request', { status: 400 })
}
