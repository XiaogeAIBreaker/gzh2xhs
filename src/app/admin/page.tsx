'use client'

import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const [kpi, setKpi] = useState<any>()
  useEffect(() => {
    fetch('/api/kpi')
      .then((r) => r.json())
      .then(setKpi)
      .catch(() => {})
  }, [])
  return (
    <main className="container mx-auto min-h-screen px-6 py-8">
      <h1 className="mb-4 text-2xl font-bold">KPI 仪表盘</h1>
      <div className="glass-card rounded-xl p-6 shadow-neon">
        <div className="mb-2">生成接口延迟</div>
        <pre className="text-sm">{JSON.stringify(kpi?.latency || {}, null, 2)}</pre>
      </div>
    </main>
  )
}
