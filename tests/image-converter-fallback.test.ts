import { describe, it, expect, vi } from 'vitest'
vi.mock('@/config', () => ({
    appConfig: {
        ai: {
            defaults: { temperature: 0.7, maxTokens: 4000 },
            deepseek: { apiKey: 'k', apiUrl: 'http://localhost', model: 'm' },
            nanobanana: { apiKey: 'k', apiUrl: 'http://localhost', model: 'm' },
        },
        features: { rateLimit: { windowMs: 60000, max: 100 } },
    },
}))
import { convertSvgToPng, createTempImageUrl } from '@/shared/lib/image-converter'

describe('ImageConverter 回退与数据URL', () => {
    it('Playwright 失败时回退到 sharp', async () => {
        vi.mock('@/shared/lib/playwright', () => ({
            getBrowser: async () => {
                throw new Error('no browser')
            },
        }))
        const svg = `<svg width="100" height="100"><text>😀</text></svg>`
        const buf = await convertSvgToPng(svg)
        expect(buf.length).toBeGreaterThan(0)
    })

    it('createTempImageUrl 返回 data URL', () => {
        const buf = Buffer.from('abc')
        const url = createTempImageUrl(buf, 'x.png')
        expect(url.startsWith('data:image/png;base64,')).toBe(true)
    })
})
