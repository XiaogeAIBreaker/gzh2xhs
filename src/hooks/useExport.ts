import { GeneratedCard } from '@/types'
import { useApp } from '@/context/AppContext'
import { useSessionId } from './useSessionId'

export function useExport() {
    const { updateState } = useApp()
    const sid = useSessionId()

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

            if (!response.ok) {
                throw new Error('导出失败')
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `小红书卡片_${new Date().getTime()}.zip`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : '导出失败',
            })
        }
    }

    const downloadSingleCard = async (card: GeneratedCard) => {
        try {
            const response = await fetch(card.imageUrl)
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `小红书卡片_${card.template}_${card.id}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : '下载失败',
            })
        }
    }

    return {
        exportAllCards,
        downloadSingleCard,
    }
}
