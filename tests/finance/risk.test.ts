import {
    varGaussian,
    equityExposure,
    bondDurationApprox,
    optionGreeksApprox,
} from '@/domain/finance/risk'

describe('risk', () => {
    it('var gaussian', () => {
        const v = varGaussian([-0.02, 0.01, 0.03, -0.01, 0.02], 0.95)
        expect(v).toBeGreaterThanOrEqual(0)
    })
    it('equity exposure', () => {
        const res = equityExposure({ kind: 'equity', symbol: 'ABC', currency: 'USD' }, 10, 100)
        expect(res.currency).toBe('USD')
        expect(res.exposure).toBe(1000)
    })
    it('bond duration approx', () => {
        const d = bondDurationApprox(
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
        expect(d).toBeGreaterThanOrEqual(0)
    })
    it('option greeks approx', () => {
        const g = optionGreeksApprox(
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
        expect(g.currency).toBe('USD')
        expect(g.delta).toBeGreaterThanOrEqual(0)
    })
})
