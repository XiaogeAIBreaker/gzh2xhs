import { describe, it, expect } from 'vitest'
import { requireAccess } from '@/interfaces/http/middleware/rbac'

function makeReq(headers?: Record<string, string>) {
    const h = new Map<string, string>()
    Object.entries(headers || {}).forEach(([k, v]) => h.set(k.toLowerCase(), v))
    return { headers: { get: (k: string) => h.get(k.toLowerCase()) || null } } as any
}

describe('RBAC middleware', () => {
    it('forbids when no auth', () => {
        const req = makeReq()
        const res = requireAccess(req as any, 'card_generate')
        expect(res).toBeInstanceOf(Response)
        expect(res!.status).toBe(403)
    })

    it('allows admin for metrics_read', () => {
        const req = makeReq({ authorization: 'Bearer admin-token' })
        const res = requireAccess(req as any, 'metrics_read')
        expect(res).toBeNull()
    })

    it('forbids user for metrics_read', () => {
        const req = makeReq({ authorization: 'Bearer user-token' })
        const res = requireAccess(req as any, 'metrics_read')
        expect(res).toBeInstanceOf(Response)
        expect(res!.status).toBe(403)
    })
})
