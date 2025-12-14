import { abortableFetch } from '@gzh2xhs/utils'

export interface KpiResponse {
    latency: Record<string, number>
}

export async function fetchKpi(signal?: AbortSignal): Promise<KpiResponse | null> {
    try {
        const res = await abortableFetch('/api/kpi', { signal: signal ?? null, timeoutMs: 10_000 })
        if (!res.ok) return null
        const json = (await res.json()) as KpiResponse
        return json
    } catch {
        return null
    }
}
