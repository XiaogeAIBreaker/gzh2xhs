import { NextResponse } from 'next/server'

export function jsonOk<T extends Record<string, any>>(
  data: T,
  status = 200,
  headers?: Record<string, string>
) {
  const init: ResponseInit = { status }
  if (headers) init.headers = new Headers(headers)
  return NextResponse.json(data, init)
}

export function jsonError(
  message: string,
  status = 400,
  details?: any,
  headers?: Record<string, string>
) {
  const init: ResponseInit = { status }
  if (headers) init.headers = new Headers(headers)
  return NextResponse.json({ success: false, error: message, details }, init)
}

export function getClientIp(req: Request & { headers: Headers }): string | undefined {
  const xfwd = req.headers.get('x-forwarded-for')
  const xreal = req.headers.get('x-real-ip')
  const ip = (xfwd || xreal || '').split(',')[0].trim()
  return ip || undefined
}
