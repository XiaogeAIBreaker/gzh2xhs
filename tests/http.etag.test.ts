import { describe, it, expect } from 'vitest'
import { jsonOkWithETag } from '@/lib/http'

function makeReq(etag?: string): Request {
    const headers = new Headers()
    if (etag) headers.set('if-none-match', etag)
    return { headers } as Request
}

describe('jsonOkWithETag', () => {
    it('returns 200 with ETag when no If-None-Match', async () => {
        const req = makeReq()
        const res = jsonOkWithETag(req, { a: 1 })
        expect(res.status).toBe(200)
        expect(res.headers.get('ETag')).toBeTruthy()
    })

    it('returns 304 when If-None-Match matches', async () => {
        const req1 = makeReq()
        const res1 = jsonOkWithETag(req1, { a: 1 })
        const etag = res1.headers.get('ETag')!
        const req2 = makeReq(etag)
        const res2 = jsonOkWithETag(req2, { a: 1 })
        expect(res2.status).toBe(304)
        expect(res2.headers.get('ETag')).toBe(etag)
    })
})
