import type Redis from 'ioredis'
import { ensureRedisConnected, getRedis } from '@/lib/redis'

type RateLimiterOptions = { windowMs: number; max: number }

export function createRateLimiter(opts: RateLimiterOptions) {
  const { windowMs, max } = opts

  const memoryHits = new Map<string, { windowStart: number; count: number }>()
  let redis: Redis | null = null

  async function allowMemory(key: string) {
    const now = Date.now()
    const cur = memoryHits.get(key)
    if (!cur || now - cur.windowStart >= windowMs) {
      memoryHits.set(key, { windowStart: now, count: 1 })
      return true
    }
    if (cur.count >= max) return false
    cur.count += 1
    return true
  }

  async function allowRedis(key: string) {
    if (!redis) redis = getRedis()
    if (!redis) return allowMemory(key)
    const connected = await ensureRedisConnected()
    if (!connected) return allowMemory(key)

    const now = Date.now()
    const windowStart = Math.floor(now / windowMs) * windowMs
    const redisKey = `rl:${key}:${windowStart}`
    const pipeline = redis.multi()
    pipeline.incr(redisKey)
    pipeline.pexpire(redisKey, windowMs)
    const results = await pipeline.exec()
    const countReply = results?.[0]?.[1]
    const count = typeof countReply === 'number' ? countReply : parseInt(String(countReply || '0'), 10)
    return count <= max
  }

  async function allow(key: string) {
    return allowRedis(key)
  }

  return { allow }
}
