import { Bond, DerivativeOption, Equity, PricingResult } from '@/domain/finance/instruments'
import { Decimal, toDecimal, roundDecimal } from '@/shared/lib/decimal'

/**
 *
 */
export function priceBond(bond: Bond, yieldRate: number): PricingResult {
    const fv = toDecimal(bond.faceValue)
    const y = toDecimal(yieldRate)
    const n = bond.couponFreqPerYear
    const c = toDecimal(bond.couponRate)
    const coupon = fv.mul(c).div(toDecimal(n))
    let pvCoupons = toDecimal(0)
    for (let k = 1; k <= n; k++) {
        const df = toDecimal(1).div(
            toDecimal(1)
                .add(y.div(toDecimal(n)))
                .pow(k),
        )
        pvCoupons = pvCoupons.add(coupon.mul(df))
    }
    const dfMaturity = toDecimal(1).div(
        toDecimal(1)
            .add(y.div(toDecimal(n)))
            .pow(n),
    )
    const pvFace = fv.mul(dfMaturity)
    const price = pvCoupons.add(pvFace)
    return { price: roundDecimal(price), currency: bond.currency }
}

/**
 *
 */
export function priceOptionBS(
    opt: DerivativeOption,
    spot: number,
    r: number,
    sigma: number,
    tYears: number,
): PricingResult {
    const S = toDecimal(spot)
    const K = toDecimal(opt.strike)
    const R = toDecimal(r)
    const V = toDecimal(sigma)
    const T = toDecimal(tYears)
    const d1 = Decimal.ln(S.div(K))
        .add(R.add(V.mul(V).div(toDecimal(2))).mul(T))
        .div(V.mul(Decimal.sqrt(T)))
    const d2 = d1.sub(V.mul(Decimal.sqrt(T)))
    const Nd1 = Decimal.cdf(d1)
    const Nd2 = Decimal.cdf(d2)
    const disc = Decimal.exp(R.mul(T).neg())
    const price =
        opt.type === 'call'
            ? S.mul(Nd1).sub(K.mul(Nd2).mul(disc))
            : K.mul(disc)
                  .mul(Decimal.cdf(d2.neg()))
                  .sub(S.mul(Decimal.cdf(d1.neg())))
    return { price: roundDecimal(price), currency: opt.currency }
}

/**
 *
 */
export function equityIndicators(eq: Equity, series: number[]) {
    const arr = series.map((v) => toDecimal(v))
    const avg = arr.reduce((s, v) => s.add(v), toDecimal(0)).div(toDecimal(arr.length))
    const varSum = arr.reduce((s, v) => s.add(v.sub(avg).mul(v.sub(avg))), toDecimal(0))
    const variance = varSum.div(toDecimal(arr.length))
    const volatility = Decimal.sqrt(variance)
    return { avg: roundDecimal(avg), volatility: roundDecimal(volatility), currency: eq.currency }
}
