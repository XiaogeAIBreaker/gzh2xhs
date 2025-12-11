import { NextRequest } from 'next/server'
import { parseAuth, AuthUser } from './auth'
import { jsonError } from '@/lib/http'

export type Action = 'card_generate' | 'card_export' | 'metrics_read'

const POLICY: Record<Action, Array<AuthUser['role']>> = {
    card_generate: ['user', 'admin'],
    card_export: ['user', 'admin'],
    metrics_read: ['admin'],
}

export function requireAccess(req: NextRequest, action: Action): Response | null {
    const user = parseAuth(req)
    const allowed = POLICY[action]
    if (!user || !allowed.includes(user.role)) {
        const traceId = req.headers.get('x-request-id') || undefined
        return jsonError('FORBIDDEN', '访问被拒绝', 403, undefined, undefined, traceId)
    }
    return null
}
