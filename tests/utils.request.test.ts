import { describe, it, expect } from 'vitest'
import { abortableFetch, withTimeout } from '@gzh2xhs/utils'

describe('request utils', () => {
    it('withTimeout resolves before timeout', async () => {
        const v = await withTimeout(Promise.resolve(42), 100)
        expect(v).toBe(42)
    })
    it('withTimeout rejects on timeout', async () => {
        await expect(withTimeout(new Promise(() => {}), 10)).rejects.toThrow()
    })
    it('abortableFetch aborts with timeout', async () => {
        await expect(
            abortableFetch('http://localhost:9', { timeoutMs: 10 }),
        ).rejects.toBeInstanceOf(Error)
    })
})
