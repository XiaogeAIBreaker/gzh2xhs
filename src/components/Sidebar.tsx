'use client'

import { AIModel } from '@/types'
import { useApp } from '@/context/AppContext'
import { useCardGeneration } from '@/hooks/useCardGeneration'
import { useExport } from '@/hooks/useExport'
import { APP_CONSTANTS } from '@/constants'

export function Sidebar() {
  const { state, updateState } = useApp()
  const { generateCard } = useCardGeneration()
  const { exportAllCards } = useExport()

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    if (text.length <= APP_CONSTANTS.MAX_TEXT_LENGTH) {
      updateState({ inputText: text })
    }
  }

  const handleModelChange = (model: AIModel) => {
    updateState({ selectedModel: model })
  }
  const handleStyleChange = (style: 'simple' | 'standard' | 'rich') => {
    updateState({ selectedStyle: style })
  }

  const handleGenerate = async () => {
    await generateCard(state.inputText, state.selectedModel)
  }

  const handleExportAll = async () => {
    await exportAllCards(state.generatedCards)
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          公众号转小红书
        </h1>
        <p className="text-sm text-gray-500">
          AI智能生成小红书爆款卡片
        </p>
      </div>

      {/* 文本输入区域 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          公众号内容
        </label>
        <textarea
          value={state.inputText}
          onChange={handleTextChange}
          placeholder="请粘贴公众号文章内容..."
          className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="text-xs text-gray-500 mt-1">
          {state.inputText.length}/{APP_CONSTANTS.MAX_TEXT_LENGTH}
        </div>
      </div>

      {/* AI模型选择 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI模型选择
        </label>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => handleModelChange('deepseek')}
            className={`p-3 text-left border rounded-lg transition-colors ${
              state.selectedModel === 'deepseek'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium">DeepSeek</div>
            <div className="text-xs text-gray-500">
              智能分析 + SVG渲染
            </div>
          </button>
          <button
            onClick={() => handleModelChange('nanobanana')}
            className={`p-3 text-left border rounded-lg transition-colors ${
              state.selectedModel === 'nanobanana'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium">Nano Banana</div>
            <div className="text-xs text-gray-500">
              直接生成图片（高质量）
            </div>
          </button>
        </div>
      </div>

      {/* 卡片款式（信息密度） */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          卡片款式（按信息密度）
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleStyleChange('simple')}
            className={`p-2 text-center border rounded-lg text-sm ${
              state.selectedStyle === 'simple' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'
            }`}
          >标题为主</button>
          <button
            onClick={() => handleStyleChange('standard')}
            className={`p-2 text-center border rounded-lg text-sm ${
              state.selectedStyle === 'standard' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'
            }`}
          >中等信息</button>
          <button
            onClick={() => handleStyleChange('rich')}
            className={`p-2 text-center border rounded-lg text-sm ${
              state.selectedStyle === 'rich' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'
            }`}
          >高信息量</button>
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        onClick={handleGenerate}
        disabled={state.isGenerating || !state.inputText.trim()}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-4"
      >
        {state.isGenerating ? '生成中...' : '生成卡片'}
      </button>

      {/* 批量导出按钮 */}
      {state.generatedCards.length > 0 && (
        <button
          onClick={handleExportAll}
          className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors mb-4"
        >
          批量导出 ({state.generatedCards.length}张)
        </button>
      )}

      {/* 错误提示 */}
      {state.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* 底部空间填充 */}
      <div className="flex-1" />
    </div>
  )
}
