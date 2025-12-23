import Redis, { Cluster } from 'ioredis'

let client: Redis | Cluster | null = null

/**
 *
 */
export function getRedis(): (Redis | Cluster) | null {
    if (client) return client
    const clusterUrls = (process.env.REDIS_CLUSTER_URLS || '').trim()
    if (clusterUrls) {
        const nodes = clusterUrls
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((u) => ({ host: new URL(u).hostname, port: Number(new URL(u).port || 6379) }))
        if (nodes.length > 0) {
            client = new Cluster(nodes, {
                redisOptions: { maxRetriesPerRequest: 2, lazyConnect: true },
            })
            return client
        }
    }
    const url = process.env.REDIS_URL || ''
    if (!url) return null
    client = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true })
    return client
}

/**
 *
 */
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
