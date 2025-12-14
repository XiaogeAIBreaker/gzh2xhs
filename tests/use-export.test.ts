/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useExport } from '@/hooks/useExport'

vi.mock('@/context/AppContext', () => {
    return {
        useApp: () => ({ updateState: vi.fn() }),
    }
})

vi.mock('@/shared/lib/downloader', () => {
    return {
        downloadBlob: vi.fn(async () => {}),
        downloadUrl: vi.fn(() => {}),
    }
})

describe('useExport', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(async (url: string, init?: any) => {
            if (url === '/api/export') {
                // 模拟 zip 二进制
                const data = new Blob([new Uint8Array([1, 2, 3])], { type: 'application/zip' })
                return {
                    ok: true,
                    blob: async () => data,
                } as any
            } else {
                const data = new Blob([new Uint8Array([4, 5, 6])], { type: 'image/png' })
                return {
                    ok: true,
                    blob: async () => data,
                } as any
            }
        }))
    })

    it('exports all cards and triggers download', async () => {
        const { exportAllCards } = useExport()
        const cards = [{ id: '1', imageUrl: 'data:image/png;base64,x', template: 'standard', model: 'deepseek', size: '1:1' }] as any
        await exportAllCards(cards)
        const { downloadBlob } = await import('@/shared/lib/downloader')
        expect(downloadBlob).toHaveBeenCalledTimes(1)
    })

    it('downloads single card and triggers download', async () => {
        const { downloadSingleCard } = useExport()
        const card = { id: '1', imageUrl: 'http://example/img.png', template: 'standard', model: 'deepseek', size: '1:1' } as any
        await downloadSingleCard(card)
        const { downloadBlob } = await import('@/shared/lib/downloader')
        expect(downloadBlob).toHaveBeenCalledTimes(1)
    })
})
