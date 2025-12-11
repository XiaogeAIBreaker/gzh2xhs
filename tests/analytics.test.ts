import { trackServer } from '@/shared/lib/analytics'
import { trackClient } from '@/shared/lib/analytics'

describe('analytics', () => {
    const req: any = {
        headers: { get: (k: string) => (k.toLowerCase() === 'x-experiment-variant' ? 'B' : null) },
        cookies: { get: (k: string) => (k === 'ab_variant' ? { value: 'A' } : undefined) },
    }

    it('trackServer attaches ip and variant', () => {
        const rec = trackServer(req, 'generate_success', { ip: '1.2.3.4' })
        expect(rec.name).toBe('generate_success')
        expect(rec.props.ip).toBe('1.2.3.4')
        expect(rec.props.variant).toBe('B')
    })

    it('trackServer uses cookie variant when header absent', () => {
        const req2: any = {
            headers: { get: () => null },
            cookies: { get: (k: string) => (k === 'ab_variant' ? { value: 'A' } : undefined) },
        }
        const rec = trackServer(req2, 'generate_success', {})
        expect(rec.props.variant).toBe('A')
    })

    it('trackClient posts to /api/track', async () => {
        const spy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({} as any)
        trackClient('page_view', { session_id: 's1' })
        await new Promise((r) => setTimeout(r, 0))
        expect(spy).toHaveBeenCalled()
        const arg = spy.mock.calls[0]?.[0] ?? ''
        expect(String(arg)).toContain('/api/track')
        spy.mockRestore()
    })
})
