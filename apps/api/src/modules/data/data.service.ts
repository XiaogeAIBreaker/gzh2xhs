import { Injectable } from '@nestjs/common'
import { dataRepo } from '../../shared/data/data.repository'
import { writeLog } from '../../shared/log/oplog'

@Injectable()
export class DataService {
    async list(query: any) {
        const type = String(query?.type || '').trim()
        const q = query?.q || undefined
        const page = Number(query?.page || 1)
        const size = Number(query?.size || 20)
        if (!type) return []
        return dataRepo.list(type, { q, page, size })
    }
    async create(input: any) {
        const created = await dataRepo.create(String(input?.type || ''), input?.item || {})
        writeLog({ action: 'create', resource: String(input?.type || ''), payload: created })
        return created
    }
    async update(input: any) {
        const next = await dataRepo.update(
            String(input?.type || ''),
            String(input?.id || ''),
            input?.patch || {},
        )
        writeLog({
            action: 'update',
            resource: String(input?.type || ''),
            payload: { id: String(input?.id || '') },
        })
        return next || { id: String(input?.id || '') }
    }
    async remove(input: any) {
        const ok = await dataRepo.delete(String(input?.type || ''), String(input?.id || ''))
        writeLog({
            action: 'delete',
            resource: String(input?.type || ''),
            payload: { id: String(input?.id || '') },
        })
        return { id: String(input?.id || ''), deleted: ok }
    }
}
