import { describe, it, expect, vi } from 'vitest'
import { AIService, AIMessage } from '@/services/types'

class DummyService extends AIService {
    async process(): Promise<any> {
        return { svgContent: '', designJson: {} as any }
    }
    public async call(messages: AIMessage[]): Promise<string> {
        return (this as any).callAPI(messages)
    }
}

vi.mock('@/config', () => {
    return {
        appConfig: {
            ai: {
                defaults: { temperature: 0.7, maxTokens: 100, requestTimeoutMs: 100 },
                deepseek: { apiKey: 'k', apiUrl: 'http://localhost', model: 'm' },
                nanobanana: { apiKey: 'k', apiUrl: 'http://localhost', model: 'm' },
            },
        },
    }
})

describe('AI call retry/timeout', () => {
    it('retries on failure and eventually succeeds', async () => {
        const svc = new DummyService(
            { apiKey: 'k', apiUrl: 'http://localhost', model: 'm' },
            'Dummy',
        )
        let calls = 0
        global.fetch = vi.fn(async () => {
            calls++
            if (calls < 2) {
                return { ok: false, status: 500, text: async () => 'err' } as any
            }
            return {
                ok: true,
                json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
            } as any
        }) as any
        const out = await svc.call([{ role: 'user', content: 'hi' }])
        expect(out).toBe('ok')
        expect((global.fetch as any).mock.calls.length).toBeGreaterThanOrEqual(2)
    })
})
