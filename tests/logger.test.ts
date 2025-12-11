import { logger, withContext } from '@/lib/logger'

describe('logger', () => {
    const origLog = console.log
    const origError = console.error
    const origWarn = console.warn
    const origDebug = console.debug
    const outputs: string[] = []
    beforeAll(() => {
        console.log = (s: any) => outputs.push(String(s))
        console.error = (s: any) => outputs.push(String(s))
        console.warn = (s: any) => outputs.push(String(s))
        console.debug = (s: any) => outputs.push(String(s))
    })
    afterAll(() => {
        console.log = origLog
        console.error = origError
        console.warn = origWarn
        console.debug = origDebug
    })

    it('includes traceId when provided', () => {
        logger.error('oops', { x: 1 }, 'Test', 'trace-xyz')
        const line = outputs.find((o) => o.includes('oops')) || ''
        const payload = JSON.parse(line)
        expect(payload.traceId).toBe('trace-xyz')
        expect(payload.scope).toBe('Test')
    })

    it('writes info/warn/debug', () => {
        logger.info('hi', { a: 1 }, 'Test')
        logger.warn('warn', { b: 2 }, 'Test')
        logger.debug('dbg', { c: 3 }, 'Test')
        const info = outputs.find((o) => o.includes('hi')) || ''
        const warn = outputs.find((o) => o.includes('warn')) || ''
        const dbg = outputs.find((o) => o.includes('dbg')) || ''
        expect(info).toContain('hi')
        expect(warn).toContain('warn')
        expect(dbg).toContain('dbg')
    })

    it('withContext propagates scope and traceId', () => {
        const ctx = withContext({ scope: 'Ctx', traceId: 't-1' })
        ctx.info('ctx-msg', { k: 1 })
        const line = outputs.find((o) => o.includes('ctx-msg')) || ''
        const payload = JSON.parse(line)
        expect(payload.scope).toBe('Ctx')
        expect(payload.traceId).toBe('t-1')
    })
})
