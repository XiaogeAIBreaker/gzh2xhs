import Redis from 'ioredis'

let client: Redis | null = null

export function getRedis(): Redis | null {
  if (client) return client
  const url = process.env.REDIS_URL || ''
  if (!url) return null
  client = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true })
  return client
}

export async function ensureRedisConnected(): Promise<boolean> {
  const c = getRedis()
  if (!c) return false
  if ((c as any).status === 'ready') return true
  try {
    await c.connect()
    return true
  } catch {
    return false
  }
}
