import * as fs from 'fs'

type Rec = { ts: string; kind: string; name: string; value: number; labels?: Record<string, any> }

const file = process.argv[2]
const stream = file ? fs.createReadStream(file, 'utf-8') : process.stdin

const counters: Record<string, number> = {}
const hist: Record<string, number[]> = {}

function handle(line: string) {
    try {
        const obj = JSON.parse(line)
        const rec: Rec = obj?.message === 'metric' ? (obj?.data as any) : obj
        if (!rec || !rec.name) return
        if (rec.kind === 'counter') counters[rec.name] = rec.value
        if (rec.kind === 'histogram') (hist[rec.name] = hist[rec.name] || []).push(rec.value)
    } catch {}
}

function summarize(arr: number[]) {
    if (!arr || !arr.length) return { count: 0 }
    const s = [...arr].sort((a, b) => a - b)
    const p = (q: number) => s[Math.floor((s.length - 1) * q)] || 0
    const avg = s.reduce((x, y) => x + y, 0) / s.length
    return { count: s.length, avg, p50: p(0.5), p95: p(0.95), p99: p(0.99) }
}

let buf = ''
stream.setEncoding('utf-8')
stream.on('data', (chunk: Buffer | string) => {
    buf += chunk as string
    const parts = buf.split(/\n/)
    buf = parts.pop() || ''
    for (const line of parts) handle(line)
})
stream.on('end', () => {
    const result = {
        counters,
        latency: summarize(hist['api_generate_latency_ms'] || []),
    }
    process.stdout.write(JSON.stringify(result, null, 2))
})
