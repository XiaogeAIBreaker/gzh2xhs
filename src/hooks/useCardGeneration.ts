import { AIModel } from '@/types'
import { useApp } from '@/context/AppContext'

export function useCardGeneration() {
  const { state, updateState } = useApp()

  const generateCard = async (text: string, model: AIModel) => {
    if (!text.trim()) {
      updateState({ error: '请输入要转换的内容' })
      return
    }

    updateState({
      isGenerating: true,
      error: null,
      generatedCards: [],
      generatedCopytext: ''
    })

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model }),
      })

      if (!response.ok) {
        throw new Error('生成失败')
      }

      const data = await response.json()
      updateState({
        generatedCards: data.cards,
        generatedCopytext: data.copytext,
        isGenerating: false,
      })
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : '生成失败',
        isGenerating: false,
      })
    }
  }

  return {
    isGenerating: state.isGenerating,
    error: state.error,
    generateCard,
  }
}