import { describe, it, expect } from 'vitest'

function makeReq(body?: any, headers?: Record<string, string>) {
    const h = new Map<string, string>()
    Object.entries(headers || {}).forEach(([k, v]) => h.set(k.toLowerCase(), v))
    return {
        json: async () => body,
        headers: { get: (k: string) => h.get(k.toLowerCase()) || null },
        nextUrl: { searchParams: new URLSearchParams() },
    } as any
}

describe('Auth + Data + Logs', () => {
    it('register, login and me', async () => {
        const { POST: register } = await import('@/app/api/auth/register/route')
        const { POST: login } = await import('@/app/api/auth/login/route')
        const { GET: me } = await import('@/app/api/auth/me/route')

        const regRes = await register(makeReq({ email: 'u@example.com', password: '123456' }))
        expect(regRes.status).toBe(200)
        const loginRes = await login(makeReq({ email: 'u@example.com', password: '123456' }))
        expect(loginRes.status).toBe(200)
        const meRes = await me(makeReq(undefined, { authorization: 'Bearer user-token' }))
        expect(meRes.status).toBe(200)
    })

    it('data CRUD and logs', async () => {
        const { POST, GET, PUT, DELETE } = await import('@/app/api/data/route')
        const createRes = await POST(makeReq({ type: 'article', item: { title: 't1' } }))
        const created = await createRes.json()
        expect(createRes.status).toBe(200)
        const id = created.item.id

        const updRes = await PUT(makeReq({ type: 'article', id, patch: { title: 't2' } }))
        expect(updRes.status).toBe(200)

        const listReq: any = makeReq(undefined, { authorization: 'Bearer admin-token' })
        ;(listReq.nextUrl.searchParams as URLSearchParams).set('type', 'article')
        const listRes = await GET(listReq)
        expect(listRes.status).toBe(200)

        const delReq: any = makeReq(undefined, {})
        ;(delReq.nextUrl.searchParams as URLSearchParams).set('type', 'article')
        ;(delReq.nextUrl.searchParams as URLSearchParams).set('id', id)
        const delRes = await DELETE(delReq)
        expect(delRes.status).toBe(200)

        const { GET: logsGet } = await import('@/app/api/logs/route')
        const logsReq: any = makeReq(undefined, { authorization: 'Bearer admin-token' })
        const logsRes = await logsGet(logsReq)
        expect(logsRes.status).toBe(200)
    })
})
