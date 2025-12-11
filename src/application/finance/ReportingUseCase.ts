import { buildPricingReport } from '@/domain/finance/reporting'
import { CurrencyCode } from '@/domain/finance/instruments'

export class ReportingUseCase {
    async pricingCsv(items: Array<{ id: string; price: number; currency: CurrencyCode }>) {
        return buildPricingReport(items)
    }
}
