import { describe, it, expect } from 'vitest'
import { counter, gauge, observe, summary, resetAll } from '@/shared/lib/metrics'

describe('metrics', () => {
  it('counter/gauge/observe work and summary returns percentiles', () => {
    resetAll()
    counter('api_ok')
    counter('api_ok', 2)
    gauge('mem_used_mb', 123)
    observe('latency_ms', 10)
    observe('latency_ms', 20)
    observe('latency_ms', 30)
    const s = summary('latency_ms')
    expect(s.count).toBe(3)
    expect(s.avg).toBeGreaterThan(0)
    expect(s.p50).toBeGreaterThan(0)
  })
})
