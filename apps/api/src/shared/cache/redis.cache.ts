import Redis from 'ioredis'
import { CacheProvider } from './cache.provider'

export class RedisCache implements CacheProvider {
    private readonly client: Redis

    constructor(url: string) {
        this.client = new Redis(url)
    }

    async get<T>(key: string): Promise<T | null> {
        const raw = await this.client.get(key)
        return raw ? (JSON.parse(raw) as T) : null
    }
    async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
        await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    }
    async del(key: string): Promise<void> {
        await this.client.del(key)
    }
}
