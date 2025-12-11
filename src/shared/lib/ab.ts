import { createHash } from 'crypto'

export type Variant = 'A' | 'B'

export function assignVariant(experimentId: string, userKey: string): Variant {
    const h = createHash('sha256').update(`${experimentId}|${userKey}`).digest()
    const bucket = h[0] ?? 0
    return bucket < 128 ? 'A' : 'B'
}
