import { setTimeout as sleep } from 'timers/promises'

const url = process.env.BENCH_URL || 'http://localhost:3000/api/generate'
const durationMs = parseInt(process.env.BENCH_DURATION_MS || '5000', 10)
const concurrency = parseInt(process.env.BENCH_CONCURRENCY || '4', 10)

const payload = JSON.stringify({ text: '性能基准测试文本', model: 'deepseek', style: 'standard', size: '1:1' })

const stats = {
  count: 0,
  ok: 0,
  fail: 0,
  latencies: [],
}

async function worker(stopAt) {
  while (Date.now() < stopAt) {
    const start = Date.now()
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })
      const ok = res.ok
      stats.count++
      if (ok) stats.ok++
      else stats.fail++
    } catch (e) {
      stats.count++
      stats.fail++
    } finally {
      stats.latencies.push(Date.now() - start)
    }
  }
}

async function main() {
  const stopAt = Date.now() + durationMs
  const workers = []
  for (let i = 0; i < concurrency; i++) workers.push(worker(stopAt))
  await Promise.all(workers)
  const sorted = stats.latencies.sort((a, b) => a - b)
  const p = (q) => sorted[Math.floor((sorted.length - 1) * q)] || 0
  const avg = sorted.reduce((s, v) => s + v, 0) / (sorted.length || 1)
  const out = {
    url,
    durationMs,
    concurrency,
    total: stats.count,
    ok: stats.ok,
    fail: stats.fail,
    p50: p(0.5),
    p90: p(0.9),
    p95: p(0.95),
    p99: p(0.99),
    avg: Math.round(avg),
  }
  console.log(JSON.stringify(out))
}

main()

