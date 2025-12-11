import { describe, it, expect } from 'vitest'
import { ExportController } from '@/interfaces/http/controllers/ExportController'

vi.mock('@/config', () => {
    return {
        appConfig: {
            ai: {
                defaults: { temperature: 0.7, maxTokens: 4000 },
                deepseek: { apiKey: 'k', apiUrl: 'http://localhost', model: 'm' },
                nanobanana: { apiKey: 'k', apiUrl: 'http://localhost', model: 'm' },
            },
            features: { rateLimit: { windowMs: 60000, max: 100 } },
        },
    }
})

function makeReq(body: any, headers?: Record<string, string>) {
    const h = new Map<string, string>()
    Object.entries(headers || {}).forEach(([k, v]) => h.set(k.toLowerCase(), v))
    return {
        json: async () => body,
        headers: { get: (k: string) => h.get(k.toLowerCase()) || null },
    } as any
}

describe('ExportController', () => {
    it('returns 400 when no images', async () => {
        const controller = new ExportController()
        const res = await controller.post(makeReq({ images: [] }))
        expect(res.status).toBe(400)
    })
    it('returns same zip on idempotency-key', async () => {
        const controller = new ExportController()
        const headers = { 'x-idempotency-key': 'k1', 'x-forwarded-for': '1.2.3.4' }
        const body = {
            images: [{ dataUrl: 'data:image/png;base64,AAA', id: 'a' }],
            namePrefix: 'n',
        }
        const res1 = await controller.post(makeReq(body, headers))
        const buf1 = new Uint8Array(await res1.arrayBuffer())
        const res2 = await controller.post(makeReq(body, headers))
        const buf2 = new Uint8Array(await res2.arrayBuffer())
        expect(buf1.length).toBe(buf2.length)
        expect(buf1[0]).toBe(buf2[0])
    })
})
