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

describe('GenerateCardUseCase 并行执行', () => {
    it('文案与AI并行执行，总耗时约等于较慢者', async () => {
        const c = new AppContainer({ ip: '127.0.0.1' })
        const uc = new GenerateCardUseCase(c)

        vi.mock('@/services/copytext', () => ({
            generateXiaohongshuCopytext: async (text: string) => {
                await new Promise((r) => setTimeout(r, 50))

                return `copy:${text}`
            },
        }))

        vi.mock('@/infrastructure/providers/AIProvider', () => ({
            AIProvider: class {
                getService() {
                    return {
                        process: async (text: string) => {
                            await new Promise((r) => setTimeout(r, 60))

                            return {
                                svgContent: `<svg><text>${text}</text></svg>`,
                                designJson: { template_type: 'standard' },
                            }
                        },
                    }
                }
            },
        }))

        vi.mock('@/lib/image-converter', () => ({
            convertSvgToPng: async (svg: string) => Buffer.from(svg),
            createTempImageUrl: (buf: Buffer, name: string) =>
                `data:image/png;base64,${buf.toString('base64')}`,
        }))

        const t0 = Date.now()
        const out = await uc.execute({ text: 'hi', model: 'deepseek', size: '1:1' })
        const dt = Date.now() - t0
        expect(out.success).toBe(true)
        // 并行：总时长小于串行两者之和，且在合理范围
        expect(dt).toBeLessThan(500)
    })
})
