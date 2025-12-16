import { Injectable } from '@nestjs/common'

@Injectable()
export class KpiService {
    async read(_query: any) {
        return { items: [] }
    }
}
