import { describe, it, expect, vi } from 'vitest'
import { GenerateCardUseCase } from '@/application/usecases/GenerateCardUseCase'
import { AppContainer } from '@/container'

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

describe('GenerateCardUseCase', () => {
  it('generates card and caches output', async () => {
    const c = new AppContainer({ ip: '127.0.0.1' })
    const uc = new GenerateCardUseCase(c)
    const out1 = await uc.execute({ text: 'hi', model: 'deepseek', size: '1:1' })
    expect(out1.success).toBe(true)
    expect(out1.cards.length).toBe(1)
    const out2 = await uc.execute({ text: 'hi', model: 'deepseek', size: '1:1' })
    // cached
    expect(out2).toEqual(out1)
  })
})
