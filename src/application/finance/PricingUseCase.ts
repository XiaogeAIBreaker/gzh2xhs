import { Bond, DerivativeOption, Equity, PricingResult } from '@/domain/finance/instruments'
import { priceBond, priceOptionBS, equityIndicators } from '@/domain/finance/pricing'
import { audit } from '@/shared/lib/audit'

/**
 *
 */
export class PricingUseCase {
    /**
     *
     */
    async priceBond(input: Bond, yieldRate: number, traceId?: string): Promise<PricingResult> {
        const res = priceBond(input, yieldRate)
        audit('price_bond', { input, yieldRate }, res, traceId ? { traceId } : undefined)
        return res
    }
    /**
     *
     */
    async priceOption(
        input: DerivativeOption,
        spot: number,
        r: number,
        sigma: number,
        tYears: number,
        traceId?: string,
    ): Promise<PricingResult> {
        const res = priceOptionBS(input, spot, r, sigma, tYears)
        audit(
            'price_option_bs',
            { input, spot, r, sigma, tYears },
            res,
            traceId ? { traceId } : undefined,
        )
        return res
    }
    /**
     *
     */
    async equityStats(input: Equity, series: number[], traceId?: string) {
        const res = equityIndicators(input, series)
        audit(
            'equity_indicators',
            { input, n: series.length },
            res,
            traceId ? { traceId } : undefined,
        )
        return res
    }
}
