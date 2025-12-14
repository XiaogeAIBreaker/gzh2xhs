import { CacheProvider } from './cache.provider'

export class MemoryCache implements CacheProvider {
    private readonly store = new Map<string, { v: unknown; exp?: number }>()

    async get<T>(key: string): Promise<T | null> {
        const hit = this.store.get(key)
        if (!hit) return null
        if (hit.exp && hit.exp < Date.now()) {
            this.store.delete(key)
            return null
        }
        return (hit.v as T) ?? null
    }
    async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
        const exp = Date.now() + ttlSeconds * 1000
        this.store.set(key, { v: value, exp })
    }
    async del(key: string): Promise<void> {
        this.store.delete(key)
    }
}
