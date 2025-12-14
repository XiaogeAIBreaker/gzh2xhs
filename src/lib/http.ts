import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import type { AppError } from '@/domain/errors'

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

export function jsonErrorFromAppError(
    err: AppError,
    traceId?: string,
    headers?: Record<string, string>,
) {
    const fields = normalizeFields(err.details)

    return jsonError(err.code, err.message, err.httpStatus, fields, headers, traceId)
}

function normalizeFields(details: any): Record<string, string[]> | undefined {
    if (!details) return undefined
    if (typeof details !== 'object') return undefined
    const out: Record<string, string[]> = {}

    for (const [k, v] of Object.entries(details)) {
        if (Array.isArray(v)) out[k] = v.map(String)
        else out[k] = [String(v)]
    }

    return Object.keys(out).length ? out : undefined
}

export function getClientIp(req: Request & { headers: Headers }): string | undefined {
    const xfwd = req.headers.get('x-forwarded-for')
    const xreal = req.headers.get('x-real-ip')
    const src = (xfwd ?? xreal ?? '') || ''
    const ip = String(src).split(',')[0]?.trim?.() || ''

    return ip || undefined
}

export function jsonOkWithETag<T extends Record<string, any>>(
    req: Request,
    data: T,
    status = 200,
    headers?: Record<string, string>,
) {
    const payload = JSON.stringify(data)
    const hash = createHash('sha256').update(payload).digest('hex').slice(0, 16)
    const etag = `W/"${hash}"`
    const inm = req.headers.get('if-none-match')
    const outHeaders = new Headers(headers ?? {})
    outHeaders.set('ETag', etag)
    if (!outHeaders.has('Cache-Control')) {
        outHeaders.set('Cache-Control', 'private, max-age=0, must-revalidate')
    }

    if (inm && inm === etag) {
        return new NextResponse(null, { status: 304, headers: outHeaders })
    }

    return NextResponse.json(data, { status, headers: outHeaders })
}
