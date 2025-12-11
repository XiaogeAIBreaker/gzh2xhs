import { NextRequest } from 'next/server'
import { jsonOk, jsonError } from '@/lib/http'
import { trackServer, EventName } from '@/shared/lib/analytics'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { name: EventName; props?: any }
    if (!body || !body.name) return jsonError('缺少事件名称', 400)
    trackServer(req as any, body.name, body.props || {})
    return jsonOk({ success: true })
  } catch (e) {
    return jsonError('事件上报失败', 500)
  }
}
