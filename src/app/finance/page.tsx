'use client'

import { useState } from 'react'
import { trackClient } from '@/shared/lib/analytics'

/**
 *
 */
export default function FinancePage() {
    const [result, setResult] = useState<any>(null)
    async function runSample() {
        trackClient('click_generate', { model: 'finance', variant: 'A' })
        const res = await fetch('/api/finance/pricing?action=bond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer user-token' },
            body: JSON.stringify({
                bond: {
                    currency: 'USD',
                    faceValue: 1000,
                    couponRate: 0.05,
                    couponFreqPerYear: 2,
                    maturityDate: '2030-01-01',
                    dayCount: 'ACT/365',
                },
                yieldRate: 0.04,
            }),
        })
        const json = await res.json().catch(() => null)
        setResult(json)
    }
    return (
        <div className="container mx-auto px-6 py-8">
            <div className="glass-card rounded-xl px-6 py-4 shadow-neon">
                <h2 className="text-lg mb-3">金融分析演示</h2>
                <button className="rounded bg-neon px-3 py-2 text-black" onClick={runSample}>
                    运行债券定价示例
                </button>
                <pre className="mt-4 text-xs whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                </pre>
            </div>
        </div>
    )
}
