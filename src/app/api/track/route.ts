import { NextRequest } from 'next/server'
import { jsonOk, jsonError } from '@/lib/http'
import { trackServer, EventName } from '@/shared/lib/analytics'

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as { name: EventName; props?: any }
        if (!body || !body.name) {
            const traceId = req.headers.get('x-request-id') || undefined
            return jsonError('VALIDATION_ERROR', '缺少事件名称', 400, undefined, undefined, traceId)
        }
        trackServer(req as any, body.name, body.props || {})
        return jsonOk({ success: true })
    } catch (e) {
        const traceId = req.headers.get('x-request-id') || undefined
        return jsonError('SERVER_ERROR', '事件上报失败', 500, undefined, undefined, traceId)
    }
}
