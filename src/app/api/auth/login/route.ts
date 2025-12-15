import { NextRequest } from 'next/server'
import { withValidation } from '@/interfaces/http/middleware/withValidation'
import { z } from 'zod'
import { jsonOk, jsonError } from '@/lib/http'
import { userRepo } from '@/infrastructure/repositories/UserRepository'

export const runtime = 'nodejs'

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export const POST = withValidation(LoginSchema, async (_req: NextRequest, body) => {
    const user = await userRepo.verify(body.email, body.password)
    if (!user) return jsonError('BAD_REQUEST', '邮箱或密码错误', 400)
    const token = user.role === 'admin' ? 'admin-token' : 'user-token'
    return jsonOk({ success: true, token, user })
})
