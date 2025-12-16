export type OpLogEntry = {
    ts: number
    userId?: string
    action: string
    resource?: string
    payload?: any
}

const logs: OpLogEntry[] = []

export function writeLog(entry: Omit<OpLogEntry, 'ts'>) {
    logs.push({ ...entry, ts: Date.now() })
}

export function queryLogs(opts?: { q?: string; limit?: number }) {
    const q = (opts?.q || '').toLowerCase()
    const lim = Math.max(1, Math.min(1000, opts?.limit || 200))
    const filtered = q ? logs.filter((l) => JSON.stringify(l).toLowerCase().includes(q)) : logs
    return filtered.slice(Math.max(0, filtered.length - lim))
}
