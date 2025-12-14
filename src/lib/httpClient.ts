import { badRequest, internalError } from '@/domain/errors'
import { ZodTypeAny } from 'zod'

type JsonValue = Record<string, any>

export type RequestOptions<TBody extends JsonValue = JsonValue> = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    body?: TBody
    timeoutMs?: number
    idempotencyKey?: string | undefined
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('请求超时')), ms)
        p.then((v) => {
            clearTimeout(t)
            resolve(v)
        }).catch((e) => {
            clearTimeout(t)
            reject(e)
        })
    })
}

export async function requestJson<
    TOut extends JsonValue = JsonValue,
    TBody extends JsonValue = JsonValue,
>(url: string, options: RequestOptions<TBody> = {}, schema?: ZodTypeAny): Promise<TOut> {
    const { method = 'POST', headers = {}, body, timeoutMs = 30_000, idempotencyKey } = options
    const h: Record<string, string> = { 'Content-Type': 'application/json', ...headers }
    if (idempotencyKey) h['x-idempotency-key'] = idempotencyKey

    const base = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined
    const isRelative = url.startsWith('/')
    const fullUrl = isRelative && base ? `${base}${url}` : url

    let resp: Response
    try {
        resp = await withTimeout(
            fetch(fullUrl, {
                method,
                headers: h,
                body: body ? JSON.stringify(body) : null,
            }),
            timeoutMs,
        )
    } catch (e) {
        throw internalError('网络请求失败或超时', e)
    }

    if (!resp.ok) {
        let msg = '请求失败'
        let code: string | undefined
        try {
            const err = await resp.json()
            msg = err?.message || msg
            code = err?.code
        } catch {}
        if (resp.status >= 400 && resp.status < 500) throw badRequest(msg, { code })
        throw internalError(msg, { code })
    }

    const data = (await resp.json()) as TOut
    if (schema) {
        const r = schema.safeParse(data)
        if (!r.success) throw badRequest('响应数据不符合预期', r.error)
        return r.data as TOut
    }
    return data
}
