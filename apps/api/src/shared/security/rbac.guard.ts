import 'reflect-metadata'
import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

type Action =
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

export const REQUIRE_ACCESS = 'REQUIRE_ACCESS'
export const RequireAccess = (action: Action) => SetMetadata(REQUIRE_ACCESS, action)

@Injectable()
export class RbacGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest()
        const user = (req as any).user as { role: 'user' | 'admin' } | null
        const action = this.reflector.get<Action>(REQUIRE_ACCESS, context.getHandler())
        if (!action) return true
        if (!user) return false
        const allowed = POLICY[action]
        return allowed.includes(user.role)
    }
}
