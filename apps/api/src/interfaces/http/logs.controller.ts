import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { LogsService } from '../../modules/logs/logs.service'
import { RequireAccess, RbacGuard } from '../../shared/security/rbac.guard'
import { AuthGuard } from '../../shared/security/auth.guard'

@ApiTags('logs')
@Controller('logs')
export class LogsController {
    constructor(private readonly svc: LogsService) {}

    @Get()
    @UseGuards(AuthGuard, RbacGuard)
    @RequireAccess('metrics_read')
    async list(@Query() q: any) {
        const res = await this.svc.list(q)
        return { ok: true, data: res }
    }
}
