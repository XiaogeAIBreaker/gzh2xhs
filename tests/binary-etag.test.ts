import { describe, it, expect } from 'vitest'
import { binaryOkWithETag } from '@/lib/http'

function makeReq(etag?: string): Request {
    const headers = new Headers()
    if (etag) headers.set('if-none-match', etag)
    return { headers } as Request
}

describe('binaryOkWithETag', () => {
    it('returns 200 with ETag when no If-None-Match', async () => {
        const req = makeReq()
        const buf = Buffer.from('abc')
        const res = binaryOkWithETag(req, buf)
        expect(res.status).toBe(200)
        expect(res.headers.get('ETag')).toBeTruthy()
    })

    it('returns 304 when If-None-Match matches', async () => {
        const req1 = makeReq()
        const buf = Buffer.from('xyz')
        const res1 = binaryOkWithETag(req1, buf)
        const etag = res1.headers.get('ETag')!
        const req2 = makeReq(etag)
        const res2 = binaryOkWithETag(req2, buf)
        expect(res2.status).toBe(304)
        expect(res2.headers.get('ETag')).toBe(etag)
    })
})
