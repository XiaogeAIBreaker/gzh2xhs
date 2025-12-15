import { NextRequest } from 'next/server'
import { withValidation } from '@/interfaces/http/middleware/withValidation'
import { z } from 'zod'
import { jsonOk, jsonError } from '@/lib/http'
import { userRepo } from '@/infrastructure/repositories/UserRepository'

export const runtime = 'nodejs'

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export const POST = withValidation(RegisterSchema, async (_req: NextRequest, body) => {
    const exists = await userRepo.findByEmail(body.email)
    if (exists) return jsonError('BAD_REQUEST', '邮箱已存在', 400)
    const user = await userRepo.create(body.email, body.password)
    return jsonOk({ success: true, user })
})
