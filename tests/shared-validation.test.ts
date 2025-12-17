import { describe, it, expect } from 'vitest'
import { validateZod } from '../packages/shared-validation/src'
import { z } from 'zod'

describe('shared-validation', () => {
  const schema = z.object({ a: z.string(), b: z.number().int() })

  it('validates successfully', () => {
    const data = validateZod(schema, { a: 'x', b: 1 })
    expect(data).toEqual({ a: 'x', b: 1 })
  })

  it('throws on invalid', () => {
    expect(() => validateZod(schema, { a: 'x', b: 'y' })).toThrow()
  })
})
