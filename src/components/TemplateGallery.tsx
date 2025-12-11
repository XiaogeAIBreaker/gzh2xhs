'use client'

import { useState } from 'react'

const templates = [
    { id: 'simple', name: '极简', desc: '标题为主，信息简洁' },
    { id: 'standard', name: '标准', desc: '适中信息，均衡排版' },
    { id: 'rich', name: '丰富', desc: '信息量大，突出重点' },
]

export default function TemplateGallery({
    value,
    onChange,
}: {
    value?: string
    onChange?: (v: string) => void
}) {
    const [current, setCurrent] = useState(value || 'standard')

    const select = (id: string) => {
        setCurrent(id)
        onChange?.(id)
    }

    return (
        <div className="grid grid-cols-3 gap-3">
            {templates.map((t) => (
                <button
                    key={t.id}
                    onClick={() => select(t.id)}
                    className={`glass-card rounded-lg p-3 text-left hover:shadow-neon transition ${
                        current === t.id ? 'border-neon/50 shadow-neon' : 'border-white/10'
                    }`}
                >
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs opacity-70 mt-1">{t.desc}</div>
                </button>
            ))}
        </div>
    )
}
