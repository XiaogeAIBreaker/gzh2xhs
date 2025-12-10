import { describe, it, expect } from 'vitest'

describe('config env schema', () => {
  it('parses defaults and required keys', async () => {
    const old = { ...process.env }
    process.env.DEEPSEEK_API_KEY = 'k'
    process.env.DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
    process.env.APICORE_AI_KEY = ''
    process.env.NANOBANANA_API_URL = 'https://kg-api.cloud/v1/chat/completions'

    const { appConfig } = await import('../src/config/index')
    expect(appConfig.ai.deepseek.enabled).toBe(true)
    expect(appConfig.ai.nanobanana.enabled).toBe(false)
    expect(appConfig.ai.defaults.temperature).toBeGreaterThan(0)

    process.env = old
  })
})

