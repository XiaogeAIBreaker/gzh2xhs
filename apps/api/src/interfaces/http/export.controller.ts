import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ExportService } from '../../modules/export/export.service'
import { RequireAccess, RbacGuard } from '../../shared/security/rbac.guard'
import { AuthGuard } from '../../shared/security/auth.guard'

@ApiTags('export')
@Controller('export')
export class ExportController {
    constructor(private readonly svc: ExportService) {}

    @Post()
    @UseGuards(AuthGuard, RbacGuard)
    @RequireAccess('card_export')
    async export(@Body() body: any) {
        const res = await this.svc.export(body)
        return { ok: true, data: res }
    }
}
