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
})
