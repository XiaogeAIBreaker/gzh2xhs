import { Injectable } from '@nestjs/common'
import { queryLogs } from '../../shared/log/oplog'

@Injectable()
export class LogsService {
    async list(query: any) {
        const q = query?.q || undefined
        const limit = Number(query?.limit || 200)
        return queryLogs({ q, limit })
    }
}
