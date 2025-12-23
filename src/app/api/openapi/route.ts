import { NextRequest } from 'next/server'
import { proxy } from '@/lib/proxy'
import { NextResponse } from 'next/server'
import { generateOpenApiDocument } from '@/docs/openapi'

export const runtime = 'nodejs'

/**
 *
 */
export async function GET(req: NextRequest) {
    if (process.env.NEXT_PUBLIC_USE_FASTIFY_API === 'true') return proxy(req, '/api/openapi', 'GET')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || undefined
    const doc = generateOpenApiDocument(baseUrl)
    return NextResponse.json(doc, { status: 200 })
}
