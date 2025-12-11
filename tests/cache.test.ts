import { LRUCache } from '@/shared/lib/cache'

describe('LRUCache', () => {
    it('evicts oldest when over capacity', () => {
        const c = new LRUCache<string>(2, 1000)
        c.set('a', 'A')
        c.set('b', 'B')
        c.set('c', 'C')
        expect(c.get('a')).toBeNull()
        expect(c.get('b')).toBe('B')
        expect(c.get('c')).toBe('C')
    })

    it('respects TTL', async () => {
        const c = new LRUCache<string>(2, 10)
        c.set('x', 'X', 5)
        await new Promise((r) => setTimeout(r, 15))
        expect(c.get('x')).toBeNull()
    })

    it('has/delete/size work', () => {
        const c = new LRUCache<string>(3, 100)
        c.set('a', 'A')
        c.set('b', 'B')
        expect(c.size()).toBe(2)
        expect(c.has('a')).toBe(true)
        c.delete('a')
        expect(c.has('a')).toBe(false)
        expect(c.size()).toBe(1)
    })
})
