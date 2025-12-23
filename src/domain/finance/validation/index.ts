import { z } from 'zod'

export const CurrencySchema = z.enum(['USD', 'EUR', 'CNY', 'JPY', 'GBP'])

export const BondSchema = z.object({
    currency: CurrencySchema,
    faceValue: z.number().positive(),
    couponRate: z.number().min(0),
    couponFreqPerYear: z.number().int().min(1),
    maturityDate: z.string().min(1),
    dayCount: z.enum(['30/360', 'ACT/360', 'ACT/365', 'ACT/ACT']),
})

export const OptionSchema = z.object({
    underlyingSymbol: z.string().min(1),
    type: z.enum(['call', 'put']),
    strike: z.number().positive(),
    maturityDate: z.string().min(1),
    currency: CurrencySchema,
})

export const EquitySchema = z.object({ symbol: z.string().min(1), currency: CurrencySchema })

/**
 *
 */
export function qualityScore(dataset: Record<string, any>) {
    let score = 100
    for (const [k, v] of Object.entries(dataset)) {
        if (v == null || (typeof v === 'number' && Number.isNaN(v))) score -= 5
    }
    if (score < 0) score = 0
    if (score > 100) score = 100
    return score
}
