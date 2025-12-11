import { logger } from '@/lib/logger'
type Labels = Record<string, string | number | boolean | undefined>

type MetricKind = 'counter' | 'histogram' | 'gauge'

type MetricRecord = {
    ts: string
    kind: MetricKind
    name: string
    value: number
    labels?: Labels
}

const histograms: Record<string, number[]> = {}
const counters: Record<string, number> = {}
const gauges: Record<string, number> = {}

interface MetricsExporter {
    emit(rec: MetricRecord): void
}

class LoggerExporter implements MetricsExporter {
    emit(rec: MetricRecord): void {
        logger.info('metric', rec, 'metrics')
    }
}

let exporter: MetricsExporter = new LoggerExporter()
const SAMPLE_RATE = Math.max(1, parseInt(process.env.METRICS_SAMPLE_RATE || '1', 10))

function nowIso() {
    return new Date().toISOString()
}

function emit(kind: MetricKind, name: string, value: number, labels?: Labels) {
    const rec: MetricRecord = { ts: nowIso(), kind, name, value }
    if (labels !== undefined) (rec as any).labels = labels
    if (shouldSample(kind)) exporter.emit(rec)
}

function shouldSample(kind: MetricKind): boolean {
    if (SAMPLE_RATE === 1) return true
    if (kind === 'counter' || kind === 'histogram')
        return Math.floor(Math.random() * SAMPLE_RATE) === 0

    return true
}

export function counter(name: string, inc = 1, labels?: Labels): number {
    counters[name] = (counters[name] || 0) + inc
    emit('counter', name, counters[name], labels)

    return counters[name]
}

export function gauge(name: string, value: number, labels?: Labels): number {
    gauges[name] = value
    emit('gauge', name, value, labels)

    return value
}

export function observe(name: string, value: number, labels?: Labels): number {
    const arr = (histograms[name] = histograms[name] || [])
    arr.push(value)
    emit('histogram', name, value, labels)

    return value
}

export function summary(name: string) {
    const arr = histograms[name] || []
    if (!arr.length) return { count: 0 }
    const sorted = [...arr].sort((a, b) => a - b)
    const p = (q: number) => sorted[Math.floor((sorted.length - 1) * q)] || 0
    const avg = sorted.reduce((s, v) => s + v, 0) / sorted.length

    return { count: arr.length, avg, p50: p(0.5), p90: p(0.9), p95: p(0.95), p99: p(0.99) }
}

export function resetAll() {
    for (const k of Object.keys(histograms)) delete histograms[k]
    for (const k of Object.keys(counters)) delete counters[k]
    for (const k of Object.keys(gauges)) delete gauges[k]
}

export type { Labels }

export function setMetricsExporter(e: MetricsExporter) {
    exporter = e
}
