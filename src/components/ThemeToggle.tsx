'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

/**
 *
 */
export default function ThemeToggle() {
    const [dark, setDark] = useState(true)

    useEffect(() => {
        const root = document.documentElement
        if (dark) root.classList.add('dark')
        else root.classList.remove('dark')
    }, [dark])

    return (
        <button
            aria-label="切换主题"
            onClick={() => setDark((d) => !d)}
            className="btn-glow shine-overlay px-3 py-2 rounded-lg border border-white/10 text-sm flex items-center gap-2 hover:shadow-neon transition"
        >
            {dark ? <Moon size={16} /> : <Sun size={16} />}
            <span>{dark ? '暗色' : '浅色'}</span>
        </button>
    )
}
