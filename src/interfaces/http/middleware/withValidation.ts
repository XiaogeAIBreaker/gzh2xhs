import { NextRequest, NextResponse } from 'next/server'
import { ZodTypeAny } from 'zod'
import { jsonError } from '@/lib/http'

export function withValidation<T>(
    schema: ZodTypeAny,
    handler: (req: NextRequest, body: T) => Promise<NextResponse>,
) {
    return async (req: NextRequest) => {
        const traceId = req.headers.get('x-request-id') || undefined
        try {
            const raw = await req.json()
            const parsed = schema.safeParse(raw)
            if (!parsed.success) {
                const fields = (parsed.error.issues || []).reduce(
                    (acc: Record<string, string[]>, issue) => {
                        const path = issue.path?.join('.') || 'request'
                        if (!acc[path]) acc[path] = []
                        acc[path].push(issue.message)
                        return acc
                    },
                    {} as Record<string, string[]>,
                )
                return jsonError('VALIDATION_ERROR', '参数错误', 400, fields, undefined, traceId)
            }
            return handler(req, parsed.data as T)
        } catch (e) {
            return jsonError('BAD_REQUEST', '请求体解析失败', 400, undefined, undefined, traceId)
        }
    }
}
