import { AIModel } from '@/types'
import { useApp, useAppActions } from '@/context/AppContext'
import { requestJson } from '@/lib/httpClient'
import { useSessionId } from './useSessionId'

/**
 *
 */
export function useCardGeneration() {
    const { state } = useApp()
    const actions = useAppActions()
    const sid = useSessionId()

    const generateCard = async (text: string, model: AIModel) => {
        if (!text.trim()) {
            actions.failGeneration('请输入要转换的内容')
            return
        }

        actions.startGeneration()

        try {
            const data = await requestJson<{ cards: any[]; copytext: string }>(
                '/api/generate',
                {
                    method: 'POST',
                    body: { text, model, style: state.selectedStyle },
                    idempotencyKey: sid ? `${sid}:gen:${text.slice(0, 32)}:${String(model)}` : undefined,
                    timeoutMs: 60_000,
                },
            )
            actions.completeGeneration(data.cards, data.copytext)
        } catch (error) {
            actions.failGeneration(error instanceof Error ? error.message : '生成失败')
        }
    }

    return {
        isGenerating: state.isGenerating,
        error: state.error,
        generateCard,
    }
}
