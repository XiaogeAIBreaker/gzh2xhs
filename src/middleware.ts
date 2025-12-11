import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { assignVariant } from '@/shared/lib/ab'
import { jsonError } from '@/lib/http'

const ALLOW_METHODS = 'GET,POST,OPTIONS'
const ALLOW_HEADERS = 'Content-Type,Authorization,X-CSRF-Token'

function parseAllowedOrigins(envVal?: string): Set<string> {
    const origins = (envVal || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    return new Set(origins)
}

function isOriginAllowed(
    req: NextRequest,
    originHeader: string | null,
    allowed: Set<string>,
): boolean {
    const origin = originHeader || ''
    const selfOrigin = req.nextUrl.origin
    if (!origin) return true
    if (origin === selfOrigin) return true
    if (allowed.has(origin)) return true
    return false
}

export function middleware(req: NextRequest) {
    const allowedOrigins = parseAllowedOrigins(process.env.CORS_ALLOW_ORIGINS)
    const origin = req.headers.get('origin')
    const isAllowed = isOriginAllowed(req, origin, allowedOrigins)
    const requestId = req.headers.get('x-request-id') || randomUUID()

    if (req.method === 'OPTIONS') return buildOptionsResponse(origin, isAllowed, requestId)
    const forbidden = isUnsafeMethod(req.method) && origin && !isAllowed
    if (forbidden)
        return jsonError(
            'FORBIDDEN',
            'Forbidden: CSRF origin check failed',
            403,
            undefined,
            undefined,
            requestId,
        )

    const res = NextResponse.next()
    applyCors(res, origin, isAllowed)
    res.headers.set('X-Request-Id', requestId)
    assignAb(res, req, requestId)
    return res
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

function isUnsafeMethod(method: string): boolean {
    return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE'
}

function buildOptionsResponse(origin: string | null, isAllowed: boolean, requestId: string) {
    const res = new NextResponse(null, { status: 204 })
    if (origin && isAllowed) {
        res.headers.set('Access-Control-Allow-Origin', origin)
        res.headers.set('Vary', 'Origin')
    }
    res.headers.set('Access-Control-Allow-Methods', ALLOW_METHODS)
    res.headers.set('Access-Control-Allow-Headers', ALLOW_HEADERS)
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    res.headers.set('X-Request-Id', requestId)
    return res
}

function applyCors(res: NextResponse, origin: string | null, isAllowed: boolean) {
    if (origin && isAllowed) {
        res.headers.set('Access-Control-Allow-Origin', origin)
        res.headers.set('Vary', 'Origin')
        res.headers.set('Access-Control-Allow-Credentials', 'true')
    }
}

function assignAb(res: NextResponse, req: NextRequest, requestId: string) {
    const userKey = (req as any).ip || requestId
    const experimentId = 'gen_style_AB'
    const existing = req.cookies.get('ab_variant')?.value
    const variant = existing || assignVariant(experimentId, userKey)
    res.headers.set('X-Experiment', experimentId)
    res.headers.set('X-Experiment-Variant', variant)
    if (!existing) {
        res.cookies.set('ab_variant', variant, { httpOnly: false, sameSite: 'lax' })
    }
}
