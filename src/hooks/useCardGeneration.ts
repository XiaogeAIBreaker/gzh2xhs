import { AIModel } from '@/types'
import { useApp, useAppActions } from '@/context/AppContext'

export function useCardGeneration() {
  const { state } = useApp()
  const actions = useAppActions()

  const generateCard = async (text: string, model: AIModel) => {
    if (!text.trim()) {
      actions.failGeneration('请输入要转换的内容')
      return
    }

    actions.startGeneration()

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model, style: state.selectedStyle }),
      })

      if (!response.ok) {
        throw new Error('生成失败')
      }

      const data = await response.json()
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
