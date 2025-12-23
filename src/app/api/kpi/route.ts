import { NextRequest } from 'next/server'
import { proxy } from '@/lib/proxy'
import { jsonOk } from '@/lib/http'
import { summary } from '@/shared/lib/metrics'

/**
 *
 */
export async function GET(req: NextRequest) {
    if (process.env.NEXT_PUBLIC_USE_FASTIFY_API === 'true') return proxy(req, '/api/kpi', 'GET')
    const generate = summary('api_generate_latency_ms')
    return jsonOk({ latency: generate })
}
