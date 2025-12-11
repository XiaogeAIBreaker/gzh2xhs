import { movingAverage, volatility, zScoreAnomalies } from '@/domain/finance/timeseries'

describe('timeseries', () => {
    it('moving average', () => {
        const out = movingAverage([1, 2, 3, 4, 5], 3)
        expect(out.length).toBe(3)
        expect(out[0]).toBeGreaterThan(0)
    })
    it('volatility non-negative', () => {
        const v = volatility([1, 2, 3, 4, 5])
        expect(v).toBeGreaterThanOrEqual(0)
    })
    it('zScore anomalies', () => {
        const idx = zScoreAnomalies([1, 1, 1, 50, 1], 2)
        expect(idx.includes(3)).toBe(true)
    })
})
