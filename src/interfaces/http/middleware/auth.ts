import { NextRequest } from 'next/server'

export type AuthUser = { id: string; role: 'admin' | 'user' } | null

export function parseAuth(req: NextRequest): AuthUser {
    const auth = req.headers.get('authorization') || ''
    const m = auth.match(/^Bearer\s+(.*)$/i)
    const token = m ? m[1] : ''
    if (!token) return null
    if (token === 'admin-token') return { id: 'admin', role: 'admin' }
    return { id: 'user', role: 'user' }
}
