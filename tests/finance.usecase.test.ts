import { describe, it, expect } from 'vitest'
import { PricingUseCase } from '@/application/finance/PricingUseCase'
import type { Bond, DerivativeOption, Equity } from '@/domain/finance/instruments'

describe('PricingUseCase', () => {
    const uc = new PricingUseCase()

    it('prices bond deterministically', async () => {
        const bond: Bond = {
            kind: 'bond',
            currency: 'USD',
            faceValue: 1000,
            couponRate: 0.05,
            couponFreqPerYear: 2,
            maturityDate: '2027-01-01',
            dayCount: 'ACT/365',
        }
        const r = 0.04
        const a = await uc.priceBond(bond, r)
        const b = await uc.priceBond(bond, r)
        expect(a).toBeDefined()
        expect(typeof a.price).toBe('number')
        expect(a.price).toBeCloseTo(b.price, 10)
    })

    it('prices european option with BS model', async () => {
        const opt: DerivativeOption = {
            kind: 'option',
            underlyingSymbol: 'TEST',
            type: 'call',
            strike: 100,
            maturityDate: '2026-01-01',
            currency: 'USD',
        }
        const res = await uc.priceOption(opt, 100, 0.02, 0.2, 1)
        expect(res).toBeDefined()
        expect(typeof res.price).toBe('number')
        expect(Number.isFinite(res.price)).toBe(true)
    })

    it('computes equity indicators', async () => {
        const eq: Equity = { kind: 'equity', symbol: 'TEST', currency: 'USD' }
        const res = await uc.equityStats(eq, [1, 2, 3, 4, 5])
        expect(res).toBeDefined()
        expect(typeof res.avg).toBe('number')
        expect(typeof res.volatility).toBe('number')
    })
})
