import { createHash } from 'crypto'

/**
 *
 */
export function getWeakETag(payload: string | Buffer | ArrayBuffer | Uint8Array): string {
    let buf: Buffer
    if (typeof payload === 'string') buf = Buffer.from(payload)
    else if (payload instanceof Buffer) buf = payload
    else if (payload instanceof Uint8Array) buf = Buffer.from(payload)
    else buf = Buffer.from(payload as ArrayBuffer)

    const hash = createHash('sha256').update(buf).digest('hex').slice(0, 16)
    return `W/"${hash}"`
}

/**
 *
 */
export function extractClientIpFromHeader(
    xForwardedFor?: string | null,
    xRealIp?: string | null,
): string | undefined {
    const src = (xForwardedFor ?? xRealIp ?? '') || ''
    const ip = String(src).split(',')[0]?.trim?.() || ''
    return ip || undefined
}
