'use client'

import { useEffect, useState } from 'react'
import { fetchKpi, KpiResponse } from '@/services/kpi'
import dynamic from 'next/dynamic'
const KpiChart = dynamic(() => import('@/features/admin/KpiChart'), {
    ssr: false,
    loading: () => <div className="text-sm text-slate-400">加载图表中...</div>,
})

export default function AdminDashboard() {
    const [kpi, setKpi] = useState<KpiResponse | null>(null)
    useEffect(() => {
        const controller = new AbortController()
        fetchKpi(controller.signal).then(setKpi)
        return () => controller.abort()
    }, [])
    return (
        <main className="container mx-auto min-h-screen px-6 py-8">
            <h1 className="mb-4 text-2xl font-bold">KPI 仪表盘</h1>
            <div className="glass-card rounded-xl p-6 shadow-neon">
                <div className="mb-2">生成接口延迟</div>
                <div className="mb-2">
                    <KpiChart data={kpi} />
                </div>
                <pre className="text-sm">{JSON.stringify(kpi?.latency || {}, null, 2)}</pre>
            </div>
        </main>
    )
}
