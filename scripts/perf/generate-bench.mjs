import { performance } from 'node:perf_hooks'
import fs from 'node:fs'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const N = Number(process.env.N || 10)

async function runOnce(i) {
    const t0 = performance.now()
    const res = await fetch(`${BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `hello ${i}`, model: 'deepseek', size: '1:1' }),
    })
    const t1 = performance.now()
    return t1 - t0
}

async function main() {
    const times = []
    for (let i = 0; i < N; i++) {
        times.push(await runOnce(i))
    }
    times.sort((a, b) => a - b)
    const p99 = times[Math.floor(times.length * 0.99) - 1] || times[times.length - 1]
    const avg = times.reduce((s, x) => s + x, 0) / times.length
    const out = { N, avg_ms: Number(avg.toFixed(2)), p99_ms: Number(p99.toFixed(2)) }
    console.log(JSON.stringify(out))
    fs.writeFileSync('perf-generate.json', JSON.stringify(out, null, 2))
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
