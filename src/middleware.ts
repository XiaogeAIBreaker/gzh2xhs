import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

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
  allowed: Set<string>
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

  // 处理预检请求
  if (req.method === 'OPTIONS') {
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

  // 基础 CSRF 原点校验：对跨域且未在白名单中的非幂等请求拒绝
  const unsafe =
    req.method === 'POST' ||
    req.method === 'PUT' ||
    req.method === 'PATCH' ||
    req.method === 'DELETE'
  if (unsafe && origin && !isAllowed) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: CSRF origin check failed' },
      { status: 403 }
    )
  }

  const res = NextResponse.next()
  if (origin && isAllowed) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Vary', 'Origin')
    res.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  res.headers.set('X-Request-Id', requestId)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
