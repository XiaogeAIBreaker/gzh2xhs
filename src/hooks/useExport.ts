import { GeneratedCard } from '@/types'
import { useApp } from '@/context/AppContext'
import { useSessionId } from './useSessionId'
import { downloadBlob } from '@/shared/lib/downloader'

export function useExport() {
    const { updateState } = useApp()
    const sid = useSessionId()

    /**
     * 批量导出卡片为 zip 并触发下载。
     */
    const exportAllCards = async (cards: GeneratedCard[]) => {
        if (cards.length === 0) return

        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(sid ? { 'x-idempotency-key': `${sid}:export:${cards.length}` } : {}),
                },
                body: JSON.stringify({
                    images: cards.map((card) => ({ id: card.id, dataUrl: card.imageUrl })),
                }),
            })

            if (!response.ok) throw new Error('EXPORT_HTTP_ERROR')

            const blob = await response.blob()
            await downloadBlob(`小红书卡片_${Date.now()}.zip`, blob)
        } catch (error) {
            updateState({
                error:
                    error instanceof Error ? mapExportError(error.message) : 'EXPORT_UNKNOWN_ERROR',
            })
        }
    }

    /**
     * 下载单张卡片。
     */
    const downloadSingleCard = async (card: GeneratedCard) => {
        try {
            const response = await fetch(card.imageUrl)
            const blob = await response.blob()
            await downloadBlob(`小红书卡片_${card.template}_${card.id}.png`, blob)
        } catch (error) {
            updateState({
                error:
                    error instanceof Error ? mapExportError(error.message) : 'EXPORT_UNKNOWN_ERROR',
            })
        }
    }

    function mapExportError(code: string): string {
        switch (code) {
            case 'EXPORT_HTTP_ERROR':
                return '导出失败（网络或服务错误）'
            default:
                return '导出失败'
        }
    }

    return {
        exportAllCards,
        downloadSingleCard,
    }
}
