export function withTimeout<T>(promise: Promise<T>, ms: number, reason = 'timeout'): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined
    return new Promise<T>((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(reason)), ms)
        promise.then(
            (v) => {
                if (timer) clearTimeout(timer)
                resolve(v)
            },
            (e) => {
                if (timer) clearTimeout(timer)
                reject(e)
            },
        )
    })
}

export async function abortableFetch(
    input: RequestInfo | URL,
    init: RequestInit & { timeoutMs?: number; signal?: AbortSignal | null } = {},
): Promise<Response> {
    const controller = new AbortController()
    const { timeoutMs = 30_000, signal, ...rest } = init
    const signals = [controller.signal]
    if (signal) signals.push(signal)
    const merged = anySignal(signals)
    const p = fetch(input, { ...rest, signal: merged })
    return withTimeout(p, timeoutMs).finally(() => controller.abort())
}

function anySignal(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController()
    const onAbort = () => controller.abort()
    for (const s of signals) {
        if (s.aborted) return AbortSignal.abort()
        s.addEventListener('abort', onAbort, { once: true })
    }
    return controller.signal
}
