import { NextRequest } from 'next/server'
import { jsonOk, jsonError } from '@/lib/http'
import { PricingUseCase } from '@/application/finance/PricingUseCase'
import { BondSchema, OptionSchema, EquitySchema, qualityScore } from '@/domain/finance/validation'
import { counter } from '@/shared/lib/metrics'

export async function handleBondPricing(req: NextRequest) {
    const body = await req.json().catch(() => null)
    const parsed = BondSchema.safeParse(body?.bond)
    if (!parsed.success)
        return jsonError('BAD_REQUEST', '参数错误', 400, parsed.error.flatten().fieldErrors)
    const y = typeof body?.yieldRate === 'number' ? body.yieldRate : NaN
    if (!Number.isFinite(y)) return jsonError('BAD_REQUEST', '参数错误', 400)
    const uc = new PricingUseCase()
    const bond = { kind: 'bond' as const, ...parsed.data }
    const traceId = req.headers.get('x-request-id') || undefined
    const res = await uc.priceBond(bond, y, traceId)
    const qs = qualityScore({ bond, yieldRate: y })
    const warnings = qs < 80 ? ['数据质量评分较低'] : undefined
    if (warnings) counter('finance_warning', 1, { kind: 'bond' })
    return jsonOk({ success: true, result: res, warnings })
}

export async function handleOptionPricing(req: NextRequest) {
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
    const uc = new PricingUseCase()
    const option = { kind: 'option' as const, ...parsed.data }
    const traceId = req.headers.get('x-request-id') || undefined
    const res = await uc.priceOption(option, spot, r, sigma, tYears, traceId)
    const qs = qualityScore({ option, spot, r, sigma, tYears })
    const warnings = qs < 80 ? ['数据质量评分较低'] : undefined
    if (warnings) counter('finance_warning', 1, { kind: 'option' })
    return jsonOk({ success: true, result: res, warnings })
}

export async function handleEquityIndicators(req: NextRequest) {
    const body = await req.json().catch(() => null)
    const parsed = EquitySchema.safeParse(body?.equity)
    if (!parsed.success)
        return jsonError('BAD_REQUEST', '参数错误', 400, parsed.error.flatten().fieldErrors)
    const series = Array.isArray(body?.series) ? body.series : []
    if (!series.every((v: any) => typeof v === 'number'))
        return jsonError('BAD_REQUEST', '参数错误', 400)
    const uc = new PricingUseCase()
    const equity = { kind: 'equity' as const, ...parsed.data }
    const traceId = req.headers.get('x-request-id') || undefined
    const res = await uc.equityStats(equity, series, traceId)
    const qs = qualityScore({ equity, series })
    const warnings = qs < 80 ? ['数据质量评分较低'] : undefined
    if (warnings) counter('finance_warning', 1, { kind: 'equity' })
    return jsonOk({ success: true, result: res, warnings })
}
