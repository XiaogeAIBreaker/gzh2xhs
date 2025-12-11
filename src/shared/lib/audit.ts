import { logger } from '@/lib/logger'

export type AuditRecord = {
    ts: string
    action: string
    actor?: string
    inputs?: any
    outputs?: any
    modelVersion?: string
    traceId?: string
}

function nowIso() {
    return new Date().toISOString()
}

export function audit(
    action: string,
    inputs?: any,
    outputs?: any,
    extras?: { actor?: string; modelVersion?: string; traceId?: string },
) {
    const rec: AuditRecord = { ts: nowIso(), action }
    if (inputs !== undefined) (rec as any).inputs = inputs
    if (outputs !== undefined) (rec as any).outputs = outputs
    if (extras?.modelVersion !== undefined) (rec as any).modelVersion = extras.modelVersion
    if (extras?.traceId !== undefined) (rec as any).traceId = extras.traceId
    if (extras?.actor !== undefined) (rec as any).actor = extras.actor
    logger.info('audit', rec, 'audit', extras?.traceId)
    return rec
}
