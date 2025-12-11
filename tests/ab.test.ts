import { describe, it, expect } from 'vitest'
import { assignVariant } from '@/shared/lib/ab'

describe('ab assignment', () => {
    it('stable assignment for same key', () => {
        const v1 = assignVariant('exp1', 'user-123')
        const v2 = assignVariant('exp1', 'user-123')
        expect(v1).toBe(v2)
    })

    it('different keys may map to different variants', () => {
        const a = assignVariant('exp1', 'user-A')
        const b = assignVariant('exp1', 'user-B')
        expect(['A', 'B']).toContain(a)
        expect(['A', 'B']).toContain(b)
    })

    it('covers both A and B branches by brute force', () => {
        const seen = new Set<string>()
        for (let i = 0; i < 256; i++) {
            const v = assignVariant('expX', `user-${i}`)
            seen.add(v)
            if (seen.has('A') && seen.has('B')) break
        }
        expect(seen.has('A')).toBe(true)
        expect(seen.has('B')).toBe(true)
    })
})
