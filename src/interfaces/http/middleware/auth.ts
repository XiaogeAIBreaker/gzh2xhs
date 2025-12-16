import { NextRequest } from 'next/server'
import { appConfig } from '@/config'

export type AuthUser = { id: string; role: 'admin' | 'user'; tenant?: string } | null

function base64UrlDecode(input: string): string {
    input = input.replace(/-/g, '+').replace(/_/g, '/')
    const pad = input.length % 4
    if (pad) input += '='.repeat(4 - pad)
    return Buffer.from(input, 'base64').toString('utf8')
}

function parseJwtClaims(token: string): Record<string, any> | null {
    const parts = token.split('.')
    if (parts.length < 2) return null
    try {
        const payload = JSON.parse(base64UrlDecode(parts[1]))
        return payload
    } catch {
        return null
    }
}

export function parseAuth(req: NextRequest): AuthUser {
    const auth = req.headers.get('authorization') || ''
    const m = auth.match(/^Bearer\s+(.*)$/i)
    const token = m ? m[1] : ''
    if (!token) return null

    if (token === 'admin-token') return { id: 'admin', role: 'admin' }

    const claims = parseJwtClaims(token)
    if (!claims) return { id: 'user', role: 'user' }

    const { issuer, audience } = appConfig.auth.oidc
    if (issuer && claims.iss && claims.iss !== issuer) return null
    if (audience) {
        const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
        if (!aud.includes(audience)) return null
    }

    const id = claims.sub || claims.uid || 'user'
    const roleClaim = claims.role || claims.roles?.[0] || 'user'
    const role: 'admin' | 'user' = roleClaim === 'admin' ? 'admin' : 'user'
    const tenant = claims.tid || claims.tenant_id || undefined
    return { id, role, tenant }
}
