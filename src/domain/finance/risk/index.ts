import { Equity, Bond, DerivativeOption } from '@/domain/finance/instruments'
import { toDecimal, roundDecimal } from '@/shared/lib/decimal'

/**
 *
 */
export function varGaussian(returns: number[], alpha = 0.95) {
    const sorted = [...returns].sort((a, b) => a - b)
    const idx = Math.max(0, Math.floor((1 - alpha) * sorted.length) - 1)
    const val = sorted[idx] ?? 0
    return roundDecimal(toDecimal(-val))
}

/**
 *
 */
export function equityExposure(eq: Equity, position: number, price: number) {
    const p = toDecimal(price)
    const pos = toDecimal(position)
    return { exposure: roundDecimal(p.mul(pos)), currency: eq.currency }
}

/**
 *
 */
export function bondDurationApprox(bond: Bond, yieldRate: number) {
    const y = toDecimal(yieldRate)
    return roundDecimal(y.mul(toDecimal(1)))
}

/**
 *
 */
export function optionGreeksApprox(
    opt: DerivativeOption,
    spot: number,
    r: number,
    sigma: number,
    tYears: number,
) {
    const s = toDecimal(spot)
    const k = toDecimal(opt.strike)
    const delta = s.div(k)
    const gamma = toDecimal(sigma).div(toDecimal(10))
    return { delta: roundDecimal(delta), gamma: roundDecimal(gamma), currency: opt.currency }
}
