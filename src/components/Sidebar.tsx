'use client'

import { AIModel } from '@/types'
import { useApp } from '@/context/AppContext'
import { useCardGeneration } from '@/hooks/useCardGeneration'
import { useExport } from '@/hooks/useExport'
import { APP_CONSTANTS } from '@/constants'
import { GlowButton } from '@/components/GlowButton'
import { SegmentedControl } from '@/components/SegmentedControl'
import { ProgressRing } from '@/components/ProgressRing'
import { Sparkles, Layers, Type } from 'lucide-react'
import TemplateGallery from '@/components/TemplateGallery'
import { useEffect } from 'react'

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey
      if (isCmd && e.key === 'Enter') {
        if (!state.isGenerating && state.inputText.trim()) {
          e.preventDefault()
          handleGenerate()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.isGenerating, state.inputText])

  return (
    <div className="h-full flex flex-col p-6 text-space-fg">
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 tracking-tight flex items-center gap-2">
          <Sparkles size={18} className="text-neon" />
          公众号转小红书
        </h1>
        <p className="text-sm opacity-70">
          AI智能生成小红书爆款卡片
        </p>
      </div>

      {/* 文本输入区域 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">公众号内容</label>
        <textarea
          value={state.inputText}
          onChange={handleTextChange}
          placeholder="请粘贴公众号文章内容..."
          className="w-full h-40 p-3 rounded-lg resize-none bg-white/5 border border-white/10 focus:ring-2 focus:ring-neon focus:border-transparent text-space-fg"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs opacity-70">字符限制</div>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">{state.inputText.length}/{APP_CONSTANTS.MAX_TEXT_LENGTH}</span>
            <ProgressRing value={state.inputText.length} max={APP_CONSTANTS.MAX_TEXT_LENGTH} />
          </div>
        </div>
      </div>

      {/* AI模型选择 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Layers size={16} />AI模型选择</label>
        <SegmentedControl
          options={[
            { label: 'DeepSeek', value: 'deepseek' },
            { label: 'Nano Banana', value: 'nanobanana' },
          ]}
          value={state.selectedModel}
          onChange={handleModelChange}
        />
        <div className="mt-2 text-xs opacity-70">DeepSeek：智能分析+SVG渲染；Nano Banana：直接生成图片</div>
      </div>

      {/* 卡片款式（信息密度） */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Type size={16} />卡片款式（按信息密度）</label>
        <SegmentedControl
          options={[
            { label: '标题为主', value: 'simple' },
            { label: '中等信息', value: 'standard' },
            { label: '高信息量', value: 'rich' },
          ]}
          value={state.selectedStyle}
          onChange={handleStyleChange}
        />
      </div>

      {/* 模板库预览 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">模板库</label>
        <TemplateGallery value={state.selectedStyle} onChange={handleStyleChange} />
      </div>

      {/* 生成按钮 */}
      <GlowButton
        onClick={handleGenerate}
        disabled={state.isGenerating || !state.inputText.trim()}
        loading={state.isGenerating}
        className="mb-4"
        variant="primary"
      >
        生成卡片
      </GlowButton>

      {/* 批量导出按钮 */}
      {state.generatedCards.length > 0 && (
        <GlowButton onClick={handleExportAll} className="mb-4" variant="success">
          批量导出 ({state.generatedCards.length}张)
        </GlowButton>
      )}

      {/* 错误提示 */}
      {state.error && (
        <div className="p-3 rounded-lg text-sm text-red-300 bg-red-500/10 border border-red-500/30">
          {state.error}
        </div>
      )}

      {/* 底部空间填充 */}
      <div className="flex-1" />
    </div>
  )
}
