import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { KpiService } from '../../modules/kpi/kpi.service'

@ApiTags('kpi')
@Controller('kpi')
export class KpiController {
    constructor(private readonly svc: KpiService) {}

    @Get()
    async read(@Query() q: any) {
        const res = await this.svc.read(q)
        return { ok: true, data: res }
    }
}
