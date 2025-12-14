type JsonValue = Record<string, any>

export type RequestOptions<TBody extends JsonValue = JsonValue> = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    body?: TBody
    timeoutMs?: number
    idempotencyKey?: string
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

export async function requestJson<TOut extends JsonValue = JsonValue, TBody extends JsonValue = JsonValue>(
    url: string,
    options: RequestOptions<TBody> = {},
): Promise<TOut> {
    const { method = 'POST', headers = {}, body, timeoutMs = 30_000, idempotencyKey } = options
    const h: Record<string, string> = { 'Content-Type': 'application/json', ...headers }
    if (idempotencyKey) h['x-idempotency-key'] = idempotencyKey

    const base = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined
    const isRelative = url.startsWith('/')
    const fullUrl = isRelative && base ? `${base}${url}` : url

    const resp = await withTimeout(
        fetch(fullUrl, {
            method,
            headers: h,
            body: body ? JSON.stringify(body) : undefined,
        }),
        timeoutMs,
    )

    if (!resp.ok) {
        let msg = '请求失败'
        try {
            const err = await resp.json()
            msg = err?.message || msg
        } catch {}
        throw new Error(msg)
    }

    return (await resp.json()) as TOut
}
