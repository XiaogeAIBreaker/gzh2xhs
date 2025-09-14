'use client'

import { useState } from 'react'
import { GeneratedCard } from '@/types'
import { useExport } from '@/hooks/useExport'

interface CardPreviewProps {
  card: GeneratedCard
}

export function CardPreview({ card }: CardPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { downloadSingleCard } = useExport()

  const handleDownload = async () => {
    await downloadSingleCard(card)
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
        {/* 卡片图片 */}
        <div
          className="aspect-[3/4] bg-gray-100 cursor-pointer"
          onClick={() => setIsExpanded(true)}
        >
          <img
            src={card.imageUrl}
            alt={`小红书卡片 ${card.template}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* 卡片信息 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              模板 {card.template}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {card.model === 'deepseek' ? 'DeepSeek' : 'Nano Banana'}
            </span>
          </div>

          <button
            onClick={handleDownload}
            className="w-full py-2 px-3 bg-blue-50 text-blue-600 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors"
          >
            下载图片
          </button>
        </div>
      </div>

      {/* 放大预览模态框 */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative max-w-md max-h-full">
            <img
              src={card.imageUrl}
              alt={`小红书卡片 ${card.template}`}
              className="max-w-full max-h-full rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* 关闭按钮 */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-2 right-2 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 下载按钮 */}
            <button
              onClick={handleDownload}
              className="absolute bottom-2 right-2 px-4 py-2 bg-white bg-opacity-90 text-gray-800 rounded-md hover:bg-opacity-100 transition-all text-sm font-medium"
            >
              下载
            </button>
          </div>
        </div>
      )}
    </>
  )
}