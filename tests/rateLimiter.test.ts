import { describe, it, expect, vi } from 'vitest'
import { createRateLimiter } from '../src/lib/rateLimiter'

describe('rateLimiter', () => {
  it('allows within window up to max', async () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 3 })
    const key = 'k'
    expect(await limiter.allow(key)).toBe(true)
    expect(await limiter.allow(key)).toBe(true)
    expect(await limiter.allow(key)).toBe(true)
    expect(await limiter.allow(key)).toBe(false)
  })

  it('resets after window', async () => {
    vi.useFakeTimers()
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 })
    const key = 'k'
    expect(await limiter.allow(key)).toBe(true)
    expect(await limiter.allow(key)).toBe(false)
    vi.advanceTimersByTime(1000)
    expect(await limiter.allow(key)).toBe(true)
    vi.useRealTimers()
  })
})

