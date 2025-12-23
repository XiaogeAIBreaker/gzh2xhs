import { toDecimal, roundDecimal } from '@/shared/lib/decimal'

/**
 *
 */
export function movingAverage(values: number[], window: number) {
    const out: number[] = []
    let acc = toDecimal(0)
    for (let i = 0; i < values.length; i++) {
        acc = acc.add(toDecimal(values[i] ?? 0))
        if (i >= window) acc = acc.sub(toDecimal(values[i - window] ?? 0))
        if (i >= window - 1) out.push(roundDecimal(acc.div(toDecimal(window))))
    }
    return out
}

/**
 *
 */
export function volatility(values: number[]) {
    const n = values.length
    if (!n) return 0
    const mean = values.reduce((s, v) => s + v, 0) / n
    const varSum = values.reduce((s, v) => s + (v - mean) * (v - mean), 0)
    return Math.sqrt(varSum / n)
}

/**
 *
 */
export function zScoreAnomalies(values: number[], threshold = 3) {
    const n = values.length
    if (!n) return [] as number[]
    const mean = values.reduce((s, v) => s + v, 0) / n
    const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) * (v - mean), 0) / n)
    const anomalies: number[] = []
    for (let i = 0; i < n; i++) {
        const v = values[i] ?? 0
        const z = sd === 0 ? 0 : (v - mean) / sd
        if (Math.abs(z) >= threshold) anomalies.push(i)
    }
    return anomalies
}
