import { describe, it, expect } from 'vitest'
import { loadConfig } from '../packages/shared-config/src'

describe('shared-config', () => {
  it('loads defaults and validates types', () => {
    const cfg = loadConfig({ NODE_ENV: 'test', PORT: '1234', LOG_LEVEL: 'info' })
    expect(cfg.NODE_ENV).toBe('test')
    expect(cfg.PORT).toBe(1234)
    expect(cfg.LOG_LEVEL).toBe('info')
  })

  it('throws on invalid config', () => {
    expect(() => loadConfig({ NODE_ENV: 'prod', PORT: 'abc' } as any)).toThrow()
  })
})
