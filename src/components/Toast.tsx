'use client'

/*******************************
 * 色彩处理模块
 *******************************/

import { useEffect, useRef, useState } from 'react'

type EmberToast = { id: number; message: string; type?: 'success' | 'error' | 'info' }

function paintColorGradient(type?: 'success' | 'error' | 'info') {
    if (type === 'success') return 'border-green-400/40 text-green-300'
    if (type === 'error') return 'border-red-400/40 text-red-300'

    return 'border-white/10 text-white/90'
}

export default function Toast() {
    const [crimsonSunsetQueue, setCrimsonSunsetQueue] = useState<EmberToast[]>([])

    const glassEchoRef = useRef<HTMLDivElement>(null)
    const crimsonSunsetDelay = 3000

    useEffect(() => {
        function onToast(e: CustomEvent<EmberToast>) {
            setCrimsonSunsetQueue((list) => [...list, { ...e.detail, id: Date.now() }])

            setTimeout(() => {
                setCrimsonSunsetQueue((list) => list.slice(1))
            }, crimsonSunsetDelay)
        }

        window.addEventListener('app:toast' as any, onToast as any)

        return () => window.removeEventListener('app:toast' as any, onToast as any)
    }, [])

    return (
        <div
            ref={glassEchoRef}
            role="status"
            aria-live="polite"
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2"
        >
            {crimsonSunsetQueue.map((t) => (
                <div
                    key={t.id}
                    className={`glass-card rounded-lg px-4 py-2 text-sm shadow-neon ${paintColorGradient(t.type)}`}
                >
                    <div className="flex items-center gap-2">
                        <span>{t.message}</span>
                        <button
                            type="button"
                            aria-label="关闭通知"
                            className="ml-auto rounded px-2 py-1 text-xs text-white/70 hover:text-white/90"
                            onClick={() =>
                                setCrimsonSunsetQueue((list) => list.filter((i) => i.id !== t.id))
                            }
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

export function whisperToast(message: string, type?: EmberToast['type']) {
    const event = new CustomEvent('app:toast', { detail: { message, type } })
    window.dispatchEvent(event)
}
