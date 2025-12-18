import { NextRequest } from 'next/server'
import { proxy } from '@/lib/proxy'
import { withValidation } from '@/interfaces/http/middleware/withValidation'
import { z } from 'zod'
import { jsonOk, jsonError } from '@/lib/http'
import { dataRepo } from '@/infrastructure/repositories/DataRepository'
import { writeLog } from '@/shared/lib/oplog'
import { requireAccess } from '@/interfaces/http/middleware/rbac'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    if (process.env.NEXT_PUBLIC_USE_FASTIFY_API === 'true') {
        const url = req.nextUrl
        url.searchParams.set('type', url.searchParams.get('type') || '')
        return proxy(req, `/api/data?${url.searchParams.toString()}`, 'GET')
    }
    const err = requireAccess(req, 'metrics_read')
    if (err) return err
    const type = (req.nextUrl.searchParams.get('type') || '').trim()
    const q = req.nextUrl.searchParams.get('q') || undefined
    const page = Number(req.nextUrl.searchParams.get('page') || '1')
    const size = Number(req.nextUrl.searchParams.get('size') || '20')
    if (!type) return jsonError('BAD_REQUEST', '缺少类型', 400)
    const items = await dataRepo.list(type, { q, page, size })
    return jsonOk({ success: true, items })
}

export async function POST(req: NextRequest) {
    if (process.env.NEXT_PUBLIC_USE_FASTIFY_API === 'true') return proxy(req, '/api/data', 'POST')
    const CreateSchema = z.object({ type: z.string().min(1), item: z.record(z.any()) })
    const handler = withValidation(CreateSchema, async (_req, body) => {
        const created = await dataRepo.create(body.type, body.item as any)
        writeLog({ action: 'create', resource: body.type, payload: created })
        return jsonOk({ success: true, item: created })
    })
    return handler(req)
}

export async function PUT(req: NextRequest) {
    if (process.env.NEXT_PUBLIC_USE_FASTIFY_API === 'true') return proxy(req, '/api/data', 'PUT')
    const UpdateSchema = z.object({
        type: z.string().min(1),
        id: z.string().min(1),
        patch: z.record(z.any()),
    })
    const handler = withValidation(UpdateSchema, async (_req, body) => {
        const updated = await dataRepo.update(body.type, body.id, body.patch as any)
        if (!updated) return jsonError('NOT_FOUND', '未找到资源', 404)
        writeLog({ action: 'update', resource: body.type, payload: { id: body.id } })
        return jsonOk({ success: true, item: updated })
    })
    return handler(req)
}

export async function DELETE(req: NextRequest) {
    if (process.env.NEXT_PUBLIC_USE_FASTIFY_API === 'true') {
        const url = req.nextUrl
        const qs = url.searchParams.toString()
        return proxy(req, `/api/data?${qs}`, 'DELETE')
    }
    const type = (req.nextUrl.searchParams.get('type') || '').trim()
    const id = (req.nextUrl.searchParams.get('id') || '').trim()
    if (!type || !id) return jsonError('BAD_REQUEST', '缺少参数', 400)
    const ok = await dataRepo.delete(type, id)
    writeLog({ action: 'delete', resource: type, payload: { id } })
    return jsonOk({ success: ok })
}
