import { Injectable } from '@nestjs/common'

@Injectable()
export class FinanceService {
    async pricing(_input: any) {
        return { price: 0 }
    }
    async report(_input: any) {
        return { reportId: 'r1' }
    }
    async risk(_input: any) {
        return { score: 0.0 }
    }
}
