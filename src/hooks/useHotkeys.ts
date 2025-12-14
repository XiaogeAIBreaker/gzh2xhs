'use client'

import { useEffect } from 'react'

/**
 * 监听快捷键并触发对应回调（客户端环境）。
 * @param map 快捷键映射，如 { 'Cmd+k': () => {} }
 */
export function useHotkeys(map: Record<string, () => void>) {
    useEffect(() => {
        let attached = false
        const handler = (e: KeyboardEvent) => {
            const key = formatKey(e)
            if (map[key]) {
                e.preventDefault()
                map[key]()
            }
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', handler)
            attached = true
        }
        return () => {
            if (attached && typeof window !== 'undefined') {
                window.removeEventListener('keydown', handler)
            }
        }
    }, [map])
}

/**
 * 组合快捷键字符串（支持 Cmd/Ctrl 前缀）。
 */
function formatKey(e: KeyboardEvent): string {
    return `${e.metaKey || e.ctrlKey ? 'Cmd+' : ''}${e.key}`
}
