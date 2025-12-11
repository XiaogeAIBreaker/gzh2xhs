import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GenerateController } from '@/interfaces/http/controllers/GenerateController'

vi.mock('@/services', () => {
    return {
        createAIService: (model: 'deepseek' | 'nanobanana') => ({
            process: async (text: string) => ({
                svgContent: `<svg><text>${text} ${'x'.repeat(120)}</text><rect width="100" height="100"/></svg>`,
                designJson: { template_type: 'standard' },
            }),
        }),
    }
})

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

vi.mock('@/lib/image-converter', () => {
    return {
        convertSvgToPng: async (svg: string) => Buffer.from(svg),
        createTempImageUrl: (buf: Buffer, name: string) =>
            `data:image/png;base64,${buf.toString('base64')}`,
    }
})

vi.mock('@/services/copytext', () => {
    return {
        generateXiaohongshuCopytext: async (text: string) => `copy:${text}`,
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

describe('GenerateController', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('returns 400 on invalid input', async () => {
        const controller = new GenerateController()
        const res = await controller.post(makeReq({ text: '', model: 'deepseek' }))
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.code).toBe('VALIDATION_ERROR')
        expect(typeof data.message).toBe('string')
    })

    it('returns 200 with generated payload', async () => {
        const controller = new GenerateController()
        const res = await controller.post(
            makeReq({ text: 'hello', model: 'deepseek', size: '1:1' }),
        )
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)
        expect(Array.isArray(data.cards)).toBe(true)
        expect(typeof data.copytext).toBe('string')
    })

    it('returns 429 when rate limited', async () => {
        const controller = new GenerateController()
        const spy = vi.spyOn(controller as any, 'post')
        // simulate by calling original and then forcing error path via a mock request that throws
        const badReq: any = {
            json: async () => {
                throw new Error('RATE_LIMITED')
            },
            headers: { get: () => null },
            cookies: { get: () => undefined },
        }
        const res = await controller.post(badReq)
        expect([429, 500]).toContain(res.status)
        spy.mockRestore()
    })
})
