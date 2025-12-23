import { NextRequest } from 'next/server'
import { jsonOk, jsonError } from '@/lib/http'
import { RiskUseCase } from '@/application/finance/RiskUseCase'
import { EquitySchema, BondSchema, OptionSchema, qualityScore } from '@/domain/finance/validation'
import { counter } from '@/shared/lib/metrics'

/**
 *
 */
export async function handleVarGaussian(req: NextRequest) {
    const body = await req.json().catch(() => null)
    const returns = Array.isArray(body?.returns) ? body.returns : []
    const alpha = typeof body?.alpha === 'number' ? body.alpha : 0.95
    if (!returns.every((v: any) => typeof v === 'number'))
        return jsonError('BAD_REQUEST', '参数错误', 400)
    const uc = new RiskUseCase()
    const traceId = req.headers.get('x-request-id') || undefined
    const res = await uc.varGaussian(returns, alpha, traceId)
    const qs = qualityScore({ returns, alpha })
    const warnings = qs < 80 ? ['数据质量评分较低'] : undefined
    if (warnings) counter('finance_warning', 1, { kind: 'var' })
    return jsonOk({ success: true, result: res, warnings })
}

/**
 *
 */
export async function handleEquityExposure(req: NextRequest) {
    const body = await req.json().catch(() => null)
    const parsed = EquitySchema.safeParse(body?.equity)
    if (!parsed.success)
        return jsonError('BAD_REQUEST', '参数错误', 400, parsed.error.flatten().fieldErrors)
    const position = typeof body?.position === 'number' ? body.position : NaN
    const price = typeof body?.price === 'number' ? body.price : NaN
    if (!Number.isFinite(position) || !Number.isFinite(price))
        return jsonError('BAD_REQUEST', '参数错误', 400)
    const uc = new RiskUseCase()
    const equity = { kind: 'equity' as const, ...parsed.data }
    const traceId = req.headers.get('x-request-id') || undefined
    const res = await uc.equityExposure(equity, position, price, traceId)
    const qs = qualityScore({ equity, position, price })
    const warnings = qs < 80 ? ['数据质量评分较低'] : undefined
    if (warnings) counter('finance_warning', 1, { kind: 'exposure' })
    return jsonOk({ success: true, result: res, warnings })
}

/**
 *
 */
export async function handleBondDuration(req: NextRequest) {
    const body = await req.json().catch(() => null)
    const parsed = BondSchema.safeParse(body?.bond)
    if (!parsed.success)
        return jsonError('BAD_REQUEST', '参数错误', 400, parsed.error.flatten().fieldErrors)
    const y = typeof body?.yieldRate === 'number' ? body.yieldRate : NaN
    if (!Number.isFinite(y)) return jsonError('BAD_REQUEST', '参数错误', 400)
    const uc = new RiskUseCase()
    const bond = { kind: 'bond' as const, ...parsed.data }
    const traceId = req.headers.get('x-request-id') || undefined
    const res = await uc.bondDurationApprox(bond, y, traceId)
    const qs = qualityScore({ bond, yieldRate: y })
    const warnings = qs < 80 ? ['数据质量评分较低'] : undefined
    if (warnings) counter('finance_warning', 1, { kind: 'duration' })
    return jsonOk({ success: true, result: res, warnings })
}

/**
 *
 */
export async function handleOptionGreeks(req: NextRequest) {
    const body = await req.json().catch(() => null)
    const parsed = OptionSchema.safeParse(body?.option)
    if (!parsed.success)
        return jsonError('BAD_REQUEST', '参数错误', 400, parsed.error.flatten().fieldErrors)
    const spot = body?.spot
    const r = body?.r
    const sigma = body?.sigma
    const tYears = body?.tYears
    if (![spot, r, sigma, tYears].every((v: any) => typeof v === 'number' && Number.isFinite(v)))
        return jsonError('BAD_REQUEST', '参数错误', 400)
    const uc = new RiskUseCase()
    const option = { kind: 'option' as const, ...parsed.data }
    const traceId = req.headers.get('x-request-id') || undefined
    const res = await uc.optionGreeksApprox(option, spot, r, sigma, tYears, traceId)
    const qs = qualityScore({ option, spot, r, sigma, tYears })
    const warnings = qs < 80 ? ['数据质量评分较低'] : undefined
    if (warnings) counter('finance_warning', 1, { kind: 'greeks' })
    return jsonOk({ success: true, result: res, warnings })
}
