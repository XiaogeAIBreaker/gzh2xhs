import { describe, it, expect } from 'vitest'
import { LRUCache } from '@gzh2xhs/utils'

describe('LRUCache', () => {
    it('stores and retrieves values', () => {
        const lru = new LRUCache<string, number>(2)
        lru.set('a', 1)
        lru.set('b', 2)
        expect(lru.get('a')).toBe(1)
        expect(lru.get('b')).toBe(2)
    })
    it('evicts least recently used', () => {
        const lru = new LRUCache<string, number>(2)
        lru.set('a', 1)
        lru.set('b', 2)
        lru.get('a')
        lru.set('c', 3)
        expect(lru.has('b')).toBe(false)
        expect(lru.has('a')).toBe(true)
        expect(lru.has('c')).toBe(true)
    })
})
