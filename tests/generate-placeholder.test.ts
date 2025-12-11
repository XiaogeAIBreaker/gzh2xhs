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
import { GenerateCardUseCase } from '@/application/usecases/GenerateCardUseCase'
import { AppContainer } from '@/container'

describe('GenerateCardUseCase 占位图降级', () => {
    it('AI 失败时返回占位图并成功', async () => {
        const c = new AppContainer({ ip: '127.0.0.1' })
        const uc = new GenerateCardUseCase(c)

        vi.mock('@/services/copytext', () => ({
            generateXiaohongshuCopytext: async (text: string) => `copy:${text}`,
        }))

        vi.mock('@/infrastructure/providers/AIProvider', () => ({
            AIProvider: class {
                getService() {
                    return {
                        process: async () => {
                            throw new Error('boom')
                        },
                    }
                }
            },
        }))

        const out = await uc.execute({ text: 'hi', model: 'deepseek', size: '1:1' })
        expect(out.success).toBe(true)
        expect(out.cards[0].imageUrl.startsWith('data:image/png;base64,')).toBe(true)
    })
})
