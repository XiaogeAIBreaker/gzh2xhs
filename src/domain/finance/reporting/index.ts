import { PricingResult } from '@/domain/finance/instruments'

export function toCsv(rows: Array<Record<string, string | number>>) {
    const headers = Object.keys(rows[0] || {})
    const lines = [headers.join(',')]
    for (const r of rows) lines.push(headers.map((h) => String(r[h] ?? '')).join(','))
    return lines.join('\n')
}

export function buildPricingReport(items: Array<PricingResult & { id: string }>) {
    return toCsv(items.map((i) => ({ id: i.id, price: i.price, currency: i.currency })))
}
