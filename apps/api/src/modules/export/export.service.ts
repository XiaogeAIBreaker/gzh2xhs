import { Injectable } from '@nestjs/common'

@Injectable()
export class ExportService {
    async export(_input: any) {
        return { url: '/exports/placeholder.csv' }
    }
}
