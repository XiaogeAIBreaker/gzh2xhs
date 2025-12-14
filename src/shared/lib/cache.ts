type CacheEntry<T> = { value: T; expiresAt: number }

export interface Cache<T> {
    get(key: string): T | null
    set(key: string, value: T, ttlMs?: number): void
    delete(key: string): void
    has(key: string): boolean
    size(): number
}

export class LRUCache<T> implements Cache<T> {
    private store: Map<string, CacheEntry<T>>
    private capacity: number
    private defaultTTL: number

    constructor(capacity: number, defaultTTL: number) {
        this.store = new Map()
        this.capacity = Math.max(1, capacity)
        this.defaultTTL = Math.max(1, defaultTTL)
    }

    get(key: string): T | null {
        const now = Date.now()
        const entry = this.store.get(key)
        if (!entry) return null
        if (now > entry.expiresAt) {
            this.store.delete(key)
            return null
        }
        this.touch(key, entry)
        return entry.value
    }

    set(key: string, value: T, ttlMs?: number): void {
        const expiresAt = Date.now() + (ttlMs ?? this.defaultTTL)
        const entry: CacheEntry<T> = { value, expiresAt }
        if (this.store.has(key)) {
            this.store.delete(key)
        }
        this.store.set(key, entry)
        this.evictIfNeeded()
    }

    delete(key: string): void {
        this.store.delete(key)
    }

    has(key: string): boolean {
        const now = Date.now()
        const entry = this.store.get(key)
        if (!entry) return false
        if (now > entry.expiresAt) {
            this.store.delete(key)
            return false
        }
        return true
    }

    size(): number {
        return this.store.size
    }

    private evictIfNeeded() {
        while (this.store.size > this.capacity) {
            const oldestKey = this.store.keys().next().value as string
            this.store.delete(oldestKey)
        }
    }

    private touch(key: string, entry: CacheEntry<T>) {
        this.store.delete(key)
        this.store.set(key, entry)
    }
}

export const defaultCache: Cache<any> = new LRUCache<any>(512, 60_000)

export function cacheGet<T>(key: string): T | null {
    return defaultCache.get(key) as T | null
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
    defaultCache.set(key, value, ttlMs)
}

export function makeKey(parts: Array<string | number | undefined>): string {
    return parts.filter((x) => x !== undefined).join('|')
}

export function invalidateByPrefix(prefix: string) {
    // naive prefix invalidation for in-memory cache
    const keys = Array.from((defaultCache as any).store?.keys?.() || []) as string[]
    for (const k of keys) {
        if (k.startsWith(prefix)) (defaultCache as any).delete(k)
    }
}
