import { NextRequest } from 'next/server'
import { jsonOk, jsonError, jsonErrorFromAppError } from '@/lib/http'
import { PricingUseCase } from '@/application/finance/PricingUseCase'
import { BondSchema, OptionSchema, EquitySchema, qualityScore } from '@/domain/finance/validation'
import { counter } from '@/shared/lib/metrics'
import { badRequest } from '@/domain/errors'

function assertBond(body: any) {
    const parsed = BondSchema.safeParse(body?.bond)
    if (!parsed.success) throw badRequest('参数错误', parsed.error.flatten().fieldErrors)
    const y = typeof body?.yieldRate === 'number' ? body.yieldRate : NaN
    if (!Number.isFinite(y)) throw badRequest('参数错误')

    return { bond: { kind: 'bond' as const, ...parsed.data }, yieldRate: y }
}

function assertOption(body: any) {
    const parsed = OptionSchema.safeParse(body?.option)
    if (!parsed.success) throw badRequest('参数错误', parsed.error.flatten().fieldErrors)
    const spot = body?.spot
    const r = body?.r
    const sigma = body?.sigma
    const tYears = body?.tYears
    if (![spot, r, sigma, tYears].every((v: any) => typeof v === 'number' && Number.isFinite(v)))
        throw badRequest('参数错误')

    return { option: { kind: 'option' as const, ...parsed.data }, spot, r, sigma, tYears }
}

function assertEquity(body: any) {
    const parsed = EquitySchema.safeParse(body?.equity)
    if (!parsed.success) throw badRequest('参数错误', parsed.error.flatten().fieldErrors)
    const series = Array.isArray(body?.series) ? body.series : []
    if (!series.every((v: any) => typeof v === 'number')) throw badRequest('参数错误')

    return { equity: { kind: 'equity' as const, ...parsed.data }, series }
}

export async function handleBondPricing(req: NextRequest) {
    const body = await req.json().catch(() => null)

    try {
        const { bond, yieldRate } = assertBond(body)
        const uc = new PricingUseCase()
        const traceId = req.headers.get('x-request-id') || undefined
        const res = await uc.priceBond(bond, yieldRate, traceId)
        const qs = qualityScore({ bond, yieldRate })
        const warnings = qs < 80 ? ['数据质量评分较低'] : undefined
        if (warnings) counter('finance_warning', 1, { kind: 'bond' })

        return jsonOk({ success: true, result: res, warnings })
    } catch (err: any) {
        const traceId = req.headers.get('x-request-id') || undefined
        if (err && err.code && err.httpStatus) return jsonErrorFromAppError(err, traceId)

        return jsonError(
            'SERVER_ERROR',
            '服务器内部错误，请重试',
            500,
            undefined,
            undefined,
            traceId,
        )
    }
}

export async function handleOptionPricing(req: NextRequest) {
    const body = await req.json().catch(() => null)

    try {
        const { option, spot, r, sigma, tYears } = assertOption(body)
        const uc = new PricingUseCase()
        const traceId = req.headers.get('x-request-id') || undefined
        const res = await uc.priceOption(option, spot, r, sigma, tYears, traceId)
        const qs = qualityScore({ option, spot, r, sigma, tYears })
        const warnings = qs < 80 ? ['数据质量评分较低'] : undefined
        if (warnings) counter('finance_warning', 1, { kind: 'option' })

        return jsonOk({ success: true, result: res, warnings })
    } catch (err: any) {
        const traceId = req.headers.get('x-request-id') || undefined
        if (err && err.code && err.httpStatus) return jsonErrorFromAppError(err, traceId)

        return jsonError(
            'SERVER_ERROR',
            '服务器内部错误，请重试',
            500,
            undefined,
            undefined,
            traceId,
        )
    }
}

export async function handleEquityIndicators(req: NextRequest) {
    const body = await req.json().catch(() => null)

    try {
        const { equity, series } = assertEquity(body)
        const uc = new PricingUseCase()
        const traceId = req.headers.get('x-request-id') || undefined
        const res = await uc.equityStats(equity, series, traceId)
        const qs = qualityScore({ equity, series })
        const warnings = qs < 80 ? ['数据质量评分较低'] : undefined
        if (warnings) counter('finance_warning', 1, { kind: 'equity' })

        return jsonOk({ success: true, result: res, warnings })
    } catch (err: any) {
        const traceId = req.headers.get('x-request-id') || undefined
        if (err && err.code && err.httpStatus) return jsonErrorFromAppError(err, traceId)

        return jsonError(
            'SERVER_ERROR',
            '服务器内部错误，请重试',
            500,
            undefined,
            undefined,
            traceId,
        )
    }
}
