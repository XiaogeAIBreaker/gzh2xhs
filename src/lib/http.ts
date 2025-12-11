import { NextResponse } from 'next/server'

export type ApiErrorResponse = {
    code: string
    message: string
    fields?: Record<string, string[]>
    traceId?: string
}

export function jsonOk<T extends Record<string, any>>(
    data: T,
    status = 200,
    headers?: Record<string, string>,
) {
    const init: ResponseInit = { status }
    if (headers) init.headers = new Headers(headers)
    return NextResponse.json(data, init)
}

export function jsonError(
    code: string,
    message: string,
    status = 400,
    fields?: Record<string, string[]>,
    headers?: Record<string, string>,
    traceId?: string,
) {
    const init: ResponseInit = { status }
    if (headers) init.headers = new Headers(headers)
    const payload: ApiErrorResponse = { code, message }
    if (fields && Object.keys(fields).length > 0) payload.fields = fields
    if (traceId) payload.traceId = traceId
    return NextResponse.json(payload, init)
}

export function getClientIp(req: Request & { headers: Headers }): string | undefined {
    const xfwd = req.headers.get('x-forwarded-for')
    const xreal = req.headers.get('x-real-ip')
    const src = (xfwd ?? xreal ?? '') || ''
    const ip = String(src).split(',')[0]?.trim?.() || ''
    return ip || undefined
}
