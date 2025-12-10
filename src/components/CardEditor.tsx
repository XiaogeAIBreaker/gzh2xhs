'use client'

import { useState } from 'react'
import { GeneratedCard } from '@/types'

export default function CardEditor({ card }: { card: GeneratedCard }) {
  const [title, setTitle] = useState('')
  const [size, setSize] = useState(card.size || '1:1')

  return (
    <div className="glass-card rounded-lg p-4">
      <div className="text-sm font-semibold mb-3">轻量编辑器（预览与导出）</div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs">
          文案标题
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full px-2 py-1 rounded bg-white/5 border border-white/10" />
        </label>
        <label className="text-xs">
          导出尺寸
          <select value={size} onChange={(e) => setSize(e.target.value)} className="mt-1 w-full px-2 py-1 rounded bg-white/5 border border-white/10">
            <option value="1:1">1:1</option>
            <option value="4:5">4:5</option>
            <option value="9:16">9:16</option>
          </select>
        </label>
      </div>
      <div className="text-xs opacity-70 mt-3">后续将与生成与导出参数联动</div>
    </div>
  )
}

