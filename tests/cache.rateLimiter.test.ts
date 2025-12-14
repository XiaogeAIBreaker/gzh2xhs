import { describe, it, expect } from 'vitest'
import { LRUCache } from '@/shared/lib/cache'
import { createRateLimiter } from '@/shared/lib/rateLimiter'

describe('LRUCache TTL', () => {
    it('expires entry after ttl', async () => {
        const c = new LRUCache<string>(10, 10)
        c.set('k', 'v')
        expect(c.get('k')).toBe('v')
        await new Promise((r) => setTimeout(r, 15))
        expect(c.get('k')).toBeNull()
    })
})

describe('RateLimiter memory fallback', () => {
    it('limits within window', async () => {
        const rl = createRateLimiter({ windowMs: 50, max: 2 })
        const key = 'test'
        expect(await rl.allow(key)).toBe(true)
        expect(await rl.allow(key)).toBe(true)
        expect(await rl.allow(key)).toBe(false)
        await new Promise((r) => setTimeout(r, 60))
        expect(await rl.allow(key)).toBe(true)
    })
})
