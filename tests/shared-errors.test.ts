import { describe, it, expect } from 'vitest'
import { AppError, mapStatus } from '../packages/shared-errors/src'

describe('shared-errors', () => {
  it('maps categories to HTTP status', () => {
    expect(mapStatus('validation')).toBe(400)
    expect(mapStatus('auth')).toBe(401)
    expect(mapStatus('permission')).toBe(403)
    expect(mapStatus('not_found')).toBe(404)
    expect(mapStatus('conflict')).toBe(409)
    expect(mapStatus('rate_limit')).toBe(429)
    expect(mapStatus('internal')).toBe(500)
  })

  it('serializes AppError response', () => {
    const err = new AppError({ message: 'bad', code: 'BAD', category: 'validation' })
    expect(err.toResponse('rid-1')).toEqual({ code: 'BAD', message: 'bad', requestId: 'rid-1' })
  })
})
