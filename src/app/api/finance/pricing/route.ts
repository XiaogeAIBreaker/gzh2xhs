import { NextRequest } from 'next/server'
import { proxy } from '@/lib/proxy'
import { requireAccess } from '@/interfaces/http/middleware/rbac'
import { handleBondPricing, handleOptionPricing, handleEquityIndicators } from '@/interfaces/http/controllers/finance/PricingController'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    if (process.env.NEXT_PUBLIC_USE_FASTIFY_API === 'true') return proxy(req, '/api/finance/pricing', 'POST')
    const err = requireAccess(req, 'finance_pricing')
    if (err) return err
    const action = (req.nextUrl.searchParams.get('action') || '').trim()
    if (action === 'bond') return handleBondPricing(req)
    if (action === 'option') return handleOptionPricing(req)
    if (action === 'equity') return handleEquityIndicators(req)
    return new Response('Bad Request', { status: 400 })
}
