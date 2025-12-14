/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest'
import { useSessionId } from '@/hooks/useSessionId'

describe('useSessionId', () => {
    it('returns existing sid from cookie', () => {
        document.cookie = 'sid=abc123'
        const sid = useSessionId()
        expect(sid).toBe('abc123')
    })

    it('generates sid when missing', () => {
        // 清空 sid
        document.cookie = 'sid=;expires=Thu, 01 Jan 1970 00:00:00 GMT'
        const sid = useSessionId()
        expect(typeof sid).toBe('string')
        expect(sid?.length).toBeGreaterThan(5)
    })
})
