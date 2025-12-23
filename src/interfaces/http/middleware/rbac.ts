import { NextRequest } from 'next/server'
import { parseAuth } from './auth'
import { jsonError } from '@/lib/http'

export type Action =
    | 'card_generate'
    | 'card_export'
    | 'metrics_read'
    | 'finance_pricing'
    | 'finance_risk'
    | 'finance_report'

const POLICY: Record<Action, Array<'user' | 'admin'>> = {
    card_generate: ['user', 'admin'],
    card_export: ['user', 'admin'],
    metrics_read: ['admin'],
    finance_pricing: ['user', 'admin'],
    finance_risk: ['user', 'admin'],
    finance_report: ['user', 'admin'],
}

type Attributes = { tenant?: string }

function isAllowed(role: 'user' | 'admin', action: Action, attrs: Attributes): boolean {
    const allowed = POLICY[action]
    if (!allowed.includes(role)) return false
    // 细粒度 ABAC（示例）：如存在租户约束，可在此处校验
    // 当前占位：若提供 tenant，则允许；未来可扩展资源/上下文匹配
    return true
}

/**
 *
 */
export function requireAccess(req: NextRequest, action: Action): Response | null {
    const user = parseAuth(req)
    if (!user || !isAllowed(user.role, action, { tenant: user.tenant })) {
        const traceId = req.headers.get('x-request-id') || undefined
        return jsonError('FORBIDDEN', '访问被拒绝', 403, undefined, undefined, traceId)
    }
    return null
}
