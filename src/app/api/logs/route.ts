import { NextRequest } from 'next/server'
import { proxy } from '@/lib/proxy'
import { jsonOk } from '@/lib/http'
import { queryLogs } from '@/shared/lib/oplog'
import { requireAccess } from '@/interfaces/http/middleware/rbac'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    if (process.env.NEXT_PUBLIC_USE_FASTIFY_API === 'true') {
        const qs = req.nextUrl.searchParams.toString()
        return proxy(req, `/api/logs?${qs}`, 'GET')
    }
    const err = requireAccess(req, 'metrics_read')
    if (err) return err
    const q = req.nextUrl.searchParams.get('q') || undefined
    const limit = Number(req.nextUrl.searchParams.get('limit') || '200')
    const items = queryLogs({ q, limit })
    return jsonOk({ success: true, logs: items })
}
