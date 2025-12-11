import { priceBond, priceOptionBS, equityIndicators } from '@/domain/finance/pricing'

describe('pricing', () => {
    it('prices a bond', () => {
        const res = priceBond(
            {
                kind: 'bond',
                currency: 'USD',
                faceValue: 1000,
                couponRate: 0.05,
                couponFreqPerYear: 2,
                maturityDate: '2030-01-01',
                dayCount: 'ACT/365',
            },
            0.04,
        )
        expect(res.currency).toBe('USD')
        expect(res.price).toBeGreaterThan(0)
    })
    it('prices a call option via BS', () => {
        const res = priceOptionBS(
            {
                kind: 'option',
                underlyingSymbol: 'ABC',
                type: 'call',
                strike: 100,
                maturityDate: '2026-01-01',
                currency: 'USD',
            },
            102,
            0.02,
            0.25,
            0.5,
        )
        expect(res.currency).toBe('USD')
        expect(res.price).toBeGreaterThan(0)
    })
    it('prices a put option via BS', () => {
        const res = priceOptionBS(
            {
                kind: 'option',
                underlyingSymbol: 'ABC',
                type: 'put',
                strike: 100,
                maturityDate: '2026-01-01',
                currency: 'USD',
            },
            98,
            0.02,
            0.25,
            0.5,
        )
        expect(res.currency).toBe('USD')
        expect(Number.isFinite(res.price)).toBe(true)
    })
    it('equity indicators returns avg and volatility', () => {
        const res = equityIndicators(
            { kind: 'equity', symbol: 'ABC', currency: 'USD' },
            [100, 101, 99, 98, 102],
        )
        expect(res.currency).toBe('USD')
        expect(res.avg).toBeGreaterThan(0)
        expect(res.volatility).toBeGreaterThanOrEqual(0)
    })
})
