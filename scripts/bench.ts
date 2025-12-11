import { priceBond } from '../src/domain/finance/pricing'
const samples = 1000
const start = Date.now()
for (let i = 0; i < samples; i++) {
    priceBond(
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
}
const ms = Date.now() - start
const result = { samples, total_ms: ms, avg_ms: ms / samples }
process.stdout.write(JSON.stringify(result))
