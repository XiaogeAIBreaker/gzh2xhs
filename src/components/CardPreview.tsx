'use client'

import { useState } from 'react'
import { GeneratedCard } from '@/types'
import { useExport } from '@/hooks/useExport'

interface CardPreviewProps {
    card: GeneratedCard
}

/**
 *
 */
export function CardPreview({ card }: CardPreviewProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const { downloadSingleCard } = useExport()
    const [tilt, setTilt] = useState<string>('')

    const handleDownload = async () => {
        await downloadSingleCard(card)
    }

    return (
        <>
            <div className="glass-card rounded-lg overflow-hidden group transition-shadow shine-overlay shadow-neon tilt-3d">
                {/* 卡片图片 */}
                <div
                    className="aspect-[3/4] bg-white/5 cursor-pointer tilt-inner"
                    style={{ transform: tilt }}
                    onMouseMove={(e) => {
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                        const x = e.clientX - rect.left
                        const y = e.clientY - rect.top
                        const rx = (y / rect.height - 0.5) * -8
                        const ry = (x / rect.width - 0.5) * 8
                        setTilt(`rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`)
                    }}
                    onMouseLeave={() => setTilt('')}
                    onClick={() => setIsExpanded(true)}
                >
                    <img
                        src={card.imageUrl}
                        alt={`小红书卡片 ${card.template}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </div>

                {/* 卡片信息 */}
                <div className="p-4 text-space-fg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">模板 {card.template}</span>
                        <span className="text-xs opacity-70 bg-white/10 px-2 py-1 rounded">
                            {card.model === 'deepseek' ? 'DeepSeek' : 'Nano Banana'}
                        </span>
                    </div>

                    <button
                        onClick={handleDownload}
                        className="btn-glow w-full py-2 px-3 text-space-fg text-sm font-medium rounded-md bg-white/10 hover:bg-white/15 transition-colors"
                    >
                        下载图片
                    </button>
                </div>
            </div>

            {/* 放大预览模态框 */}
            {isExpanded && (
                <div
                    className="fixed inset-0 z-50 p-4 flex items-center justify-center"
                    onClick={() => setIsExpanded(false)}
                >
                    <div className="absolute inset-0 bg-black/70 backdrop-blur" />
                    <div className="relative max-w-md max-h-full glass-card rounded-lg shadow-neon">
                        <img
                            src={card.imageUrl}
                            alt={`小红书卡片 ${card.template}`}
                            className="max-w-full max-h-full rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* 关闭按钮 */}
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all"
                        >
                            <svg
                                className="w-5 h-5 text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>

                        {/* 下载按钮 */}
                        <button
                            onClick={handleDownload}
                            className="absolute bottom-2 right-2 px-4 py-2 bg-white/90 text-gray-800 rounded-md hover:bg-white transition-all text-sm font-medium"
                        >
                            下载
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
