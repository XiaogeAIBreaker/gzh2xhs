import { NextRequest } from 'next/server'
import { jsonOk, jsonError } from '@/lib/http'
import { parseAuth } from '@/interfaces/http/middleware/auth'
import { userRepo } from '@/infrastructure/repositories/UserRepository'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    const auth = parseAuth(req)
    if (!auth) return jsonError('FORBIDDEN', '未登录', 403)
    // 简化：根据角色返回用户信息；真实系统可使用 JWT 解析用户ID
    const email = auth.id === 'admin' ? 'admin@example.com' : 'user@example.com'
    const user = (await userRepo.findByEmail(email)) || { id: auth.id, email, role: auth.role }
    return jsonOk({ success: true, user })
}
