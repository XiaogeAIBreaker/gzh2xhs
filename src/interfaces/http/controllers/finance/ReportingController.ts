import { NextRequest } from 'next/server'
import { jsonOk, jsonError } from '@/lib/http'
import { ReportingUseCase } from '@/application/finance/ReportingUseCase'

export async function handlePricingReport(req: NextRequest) {
    const body = await req.json().catch(() => null)
    const items = Array.isArray(body?.items) ? body.items : []
    if (
        !items.every(
            (i: any) =>
                typeof i?.id === 'string' &&
                typeof i?.price === 'number' &&
                typeof i?.currency === 'string',
        )
    )
        return jsonError('BAD_REQUEST', '参数错误', 400)
    const uc = new ReportingUseCase()
    const csv = await uc.pricingCsv(items)
    return jsonOk({ success: true, csv })
}
