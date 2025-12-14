'use client'

import { useEffect, useRef } from 'react'
import type { KpiResponse } from '@/services/kpi'

interface Props {
    data: KpiResponse | null
}

export default function KpiChart({ data }: Props) {
    const ref = useRef<HTMLCanvasElement>(null)
    useEffect(() => {
        const c = ref.current
        if (!c || !data) return
        const ctx = c.getContext('2d')
        if (!ctx) return
        const entries = Object.entries(data.latency || {})
        const w = (c.width = 600)
        const h = (c.height = 160)
        ctx.clearRect(0, 0, w, h)
        const barW = Math.max(10, Math.floor(w / Math.max(1, entries.length)))
        const max = Math.max(1, ...entries.map(([, v]) => v))
        entries.forEach(([key, val], i) => {
            const x = i * barW + 4
            const bh = Math.floor((val / max) * (h - 20))
            ctx.fillStyle = '#60a5fa'
            ctx.fillRect(x, h - bh - 10, barW - 8, bh)
            ctx.fillStyle = '#94a3b8'
            ctx.font = '10px sans-serif'
            ctx.fillText(key, x, h - 2)
        })
    }, [data])
    return <canvas ref={ref} className="w-full" />
}
