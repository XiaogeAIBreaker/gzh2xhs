import { convertSvgToPng, convertBase64ToPng } from '@/shared/lib/image-converter'

type Job = { type: 'svg'; payload: string } | { type: 'base64'; payload: string }

self.onmessage = async (e: MessageEvent<Job>) => {
    const job = e.data
    try {
        if (job.type === 'svg') {
            const png = await convertSvgToPng(job.payload)
            ;(self as unknown as Worker).postMessage({ ok: true, payload: png }, undefined)
            return
        }
        if (job.type === 'base64') {
            const png = await convertBase64ToPng(job.payload)
            ;(self as unknown as Worker).postMessage({ ok: true, payload: png }, undefined)
            return
        }
        ;(self as unknown as Worker).postMessage({ ok: false, error: 'unknown_job' }, undefined)
    } catch (err) {
        ;(self as unknown as Worker).postMessage(
            { ok: false, error: err instanceof Error ? err.message : String(err) },
            undefined,
        )
    }
}
