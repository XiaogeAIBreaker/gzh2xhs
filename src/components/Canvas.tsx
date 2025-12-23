'use client'

import { useApp } from '@/context/AppContext'
import { CardPreview } from './CardPreview'
import { motion } from 'framer-motion'
import { whisperToast } from './Toast'

/**
 *
 */
export function Canvas() {
    const { state, updateState } = useApp()

    // 持久化上次生成结果
    if (typeof window !== 'undefined') {
        try {
            if (state.generatedCards.length > 0 || state.generatedCopytext) {
                const payload = {
                    cards: state.generatedCards,
                    copy: state.generatedCopytext,
                }
                window.localStorage.setItem('app:last', JSON.stringify(payload))
            }
        } catch {}
    }

    if (state.isGenerating) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="orbit-loader mx-auto mb-4">
                        <div className="dot" />
                        <div className="dot" />
                        <div className="dot" />
                        <div className="dot" />
                        <div className="ring" />
                    </div>
                    <p className="text-lg text-space-fg">正在生成小红书卡片...</p>
                    <p className="text-sm opacity-70 mt-2">
                        使用 {state.selectedModel === 'deepseek' ? 'DeepSeek' : 'Nano Banana'} 模型
                    </p>
                </div>
            </div>
        )
    }

    if (state.generatedCards.length === 0 && !state.isGenerating) {
        return (
            <div className="h-full flex items-center justify-center">
                <motion.div
                    className="text-center max-w-md"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center glass-card">
                        <svg
                            className="w-12 h-12 text-neon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-space-fg mb-2">开始创作小红书卡片</h2>
                    <p className="opacity-70">在左侧输入公众号内容，选择模型，点击生成即可开始</p>
                    <div className="mt-4">
                        <button
                            onClick={() => {
                                try {
                                    const raw = window.localStorage.getItem('app:last')
                                    if (!raw) return
                                    const data = JSON.parse(raw)
                                    updateState({
                                        generatedCards: data.cards || [],
                                        generatedCopytext: data.copy || '',
                                    })
                                    whisperToast('已恢复上次结果', 'info')
                                } catch {}
                            }}
                            className="btn-glow px-4 py-2 rounded-md text-sm bg-white/10 hover:bg-white/15"
                        >
                            恢复上次结果
                        </button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="h-full overflow-auto">
            <div className="p-6">
                {/* 卡片网格 */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-space-fg mb-4">
                        生成的卡片 ({state.generatedCards.length}张)
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        {state.generatedCards.map((card) => (
                            <CardPreview key={card.id} card={card} />
                        ))}
                    </div>
                </div>

                {/* 生成的文案 */}
                {state.generatedCopytext && (
                    <div className="glass-card rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-space-fg mb-3">小红书爆款文案</h3>
                        <div className="bg-white/5 rounded-lg p-4">
                            <pre className="whitespace-pre-wrap text-sm text-space-fg/90 font-medium leading-relaxed">
                                {state.generatedCopytext}
                            </pre>
                        </div>
                        <div className="mt-3 max-w-xs">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(state.generatedCopytext)
                                    whisperToast('文案已复制', 'success')
                                }}
                                className="btn-glow w-full px-4 py-2 rounded-md text-sm text-space-fg bg-white/10 hover:bg-white/15"
                            >
                                复制文案
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
