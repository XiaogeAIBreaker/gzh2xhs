import { cacheGet, cacheSet, makeKey } from '@/shared/lib/cache'

export class CacheRepository {
  get<T>(key: string): T | null {
    return cacheGet<T>(key)
  }
  set<T>(key: string, value: T, ttlMs: number): void {
    cacheSet(key, value, ttlMs)
  }
  makeKey(parts: Array<string | number | undefined>): string {
    return makeKey(parts)
  }
}
