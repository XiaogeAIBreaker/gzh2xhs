import { NextRequest } from 'next/server'
import { jsonOk } from '@/lib/http'
import { summary } from '@/shared/lib/metrics'

export async function GET(_req: NextRequest) {
  const generate = summary('api_generate_latency_ms')
  return jsonOk({
    latency: generate,
  })
}
