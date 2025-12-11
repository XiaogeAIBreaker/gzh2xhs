import { describe, it, expect, vi } from 'vitest'
import { createRateLimiter } from '@/shared/lib/rateLimiter'

describe('RateLimiter 回退与滑动窗口', () => {
    it('Redis 失联时回退到内存限流', async () => {
        vi.mock('@/shared/lib/redis', () => ({
            getRedis: () => null,
            ensureRedisConnected: async () => false,
        }))
        const rl = createRateLimiter({ windowMs: 50, max: 3 })
        const key = 'k'
        expect(await rl.allow(key)).toBe(true)
        expect(await rl.allow(key)).toBe(true)
        expect(await rl.allow(key)).toBe(true)
        expect(await rl.allow(key)).toBe(false)
    })

    it('窗口到期后重置计数', async () => {
        vi.mock('@/shared/lib/redis', () => ({
            getRedis: () => null,
            ensureRedisConnected: async () => false,
        }))
        const rl = createRateLimiter({ windowMs: 30, max: 2 })
        const key = 'k2'
        expect(await rl.allow(key)).toBe(true)
        expect(await rl.allow(key)).toBe(true)
        expect(await rl.allow(key)).toBe(false)
        await new Promise((r) => setTimeout(r, 40))
        expect(await rl.allow(key)).toBe(true)
    })
})
