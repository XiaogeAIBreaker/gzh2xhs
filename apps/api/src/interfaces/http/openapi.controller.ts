import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { OpenapiService } from '../../modules/openapi/openapi.service'

@ApiTags('openapi')
@Controller('openapi')
export class OpenapiController {
    constructor(private readonly svc: OpenapiService) {}

    @Get()
    async doc() {
        const res = await this.svc.getDocument()
        return res
    }
}
