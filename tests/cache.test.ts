import { describe, it, expect } from 'vitest'
import { cacheGet, cacheSet, makeKey } from '@/shared/lib/cache'

describe('cache', () => {
  it('sets and gets values within ttl', async () => {
    const key = makeKey(['a', 1])
    cacheSet(key, { ok: true }, 50)
    expect(cacheGet<{ ok: boolean }>(key)).toEqual({ ok: true })
  })

  it('expires after ttl', async () => {
    const key = makeKey(['b', 2])
    cacheSet(key, { ok: true }, 10)
    await new Promise((r) => setTimeout(r, 20))
    expect(cacheGet(key)).toBeNull()
  })
})
