'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

export default function CommandPalette() {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === '/') {
                e.preventDefault()
                setOpen(true)
            }
            if (e.key === 'Escape') setOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    return (
        <>
            <button
                aria-label="打开命令面板"
                onClick={() => setOpen(true)}
                className="btn-glow shine-overlay px-3 py-2 rounded-lg border border-white/10 text-sm flex items-center gap-2"
            >
                <Search size={16} />
                <span>命令面板</span>
                <span className="ml-2 text-xs text-white/50">/</span>
            </button>
            {open && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
                    <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[600px] glass-card rounded-xl p-4 shadow-neon">
                        <input
                            autoFocus
                            placeholder="搜索操作（生成、导出、切换模板/主题）"
                            className="w-full bg-transparent outline-none text-sm px-3 py-2 border border-white/10 rounded-lg"
                        />
                        <div className="mt-3 text-xs text-white/60">按 Esc 关闭</div>
                    </div>
                </div>
            )}
        </>
    )
}
