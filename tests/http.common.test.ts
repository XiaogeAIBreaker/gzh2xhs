import { describe, it, expect } from 'vitest'
import { getWeakETag, extractClientIpFromHeader } from '@/shared/lib/http-common'
import { createHash } from 'crypto'

describe('http-common', () => {
    it('getWeakETag matches sha256-16 weak etag for string', () => {
        const data = JSON.stringify({ a: 1, b: 'x' })
        const expected = `W/"${createHash('sha256').update(Buffer.from(data)).digest('hex').slice(0, 16)}"`
        expect(getWeakETag(data)).toBe(expected)
    })

    it('getWeakETag matches for Buffer', () => {
        const buf = Buffer.from('hello world')
        const expected = `W/"${createHash('sha256').update(buf).digest('hex').slice(0, 16)}"`
        expect(getWeakETag(buf)).toBe(expected)
    })

    it('extractClientIpFromHeader prefers x-forwarded-for first value', () => {
        const xfwd = '1.2.3.4, 5.6.7.8'
        expect(extractClientIpFromHeader(xfwd, null)).toBe('1.2.3.4')
    })

    it('extractClientIpFromHeader falls back to x-real-ip', () => {
        expect(extractClientIpFromHeader(null, '9.9.9.9')).toBe('9.9.9.9')
    })
})
