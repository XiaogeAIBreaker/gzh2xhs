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
})
