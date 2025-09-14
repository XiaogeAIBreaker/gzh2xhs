'use client'

import { useApp } from '@/context/AppContext'
import { CardPreview } from './CardPreview'

export function Canvas() {
  const { state } = useApp()
  if (state.isGenerating) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">正在生成小红书卡片...</p>
          <p className="text-sm text-gray-400 mt-2">
            使用 {state.selectedModel === 'deepseek' ? 'DeepSeek' : 'Nano Banana'} 模型
          </p>
        </div>
      </div>
    )
  }

  if (state.generatedCards.length === 0 && !state.isGenerating) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            开始创作小红书卡片
          </h2>
          <p className="text-gray-500">
            在左侧输入公众号内容，选择AI模型，点击生成按钮即可开始创作
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        {/* 卡片网格 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            生成的卡片 ({state.generatedCards.length}张)
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {state.generatedCards.map((card) => (
              <CardPreview
                key={card.id}
                card={card}
              />
            ))}
          </div>
        </div>

        {/* 生成的文案 */}
        {state.generatedCopytext && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              小红书爆款文案
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-medium leading-relaxed">
                {state.generatedCopytext}
              </pre>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(state.generatedCopytext)
                // 可以添加复制成功提示
              }}
              className="mt-3 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
            >
              复制文案
            </button>
          </div>
        )}
      </div>
    </div>
  )
}