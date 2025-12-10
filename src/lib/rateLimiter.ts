type RateLimiterOptions = { windowMs: number; max: number }

export function createRateLimiter(opts: RateLimiterOptions) {
  const hits = new Map<string, { windowStart: number; count: number }>()
  const { windowMs, max } = opts

  async function allow(key: string) {
    const now = Date.now()
    const cur = hits.get(key)
    if (!cur || now - cur.windowStart >= windowMs) {
      hits.set(key, { windowStart: now, count: 1 })
      return true
    }
    if (cur.count >= max) return false
    cur.count += 1
    return true
  }

  return { allow }
}

