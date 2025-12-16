import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { FinanceService } from '../../modules/finance/finance.service'
import { RequireAccess, RbacGuard } from '../../shared/security/rbac.guard'
import { AuthGuard } from '../../shared/security/auth.guard'

@ApiTags('finance')
@Controller('finance')
export class FinanceController {
    constructor(private readonly svc: FinanceService) {}

    @Post('pricing')
    @UseGuards(AuthGuard, RbacGuard)
    @RequireAccess('finance_pricing')
    async pricing(@Body() body: any) {
        const res = await this.svc.pricing(body)
        return { ok: true, data: res }
    }

    @Post('report')
    @UseGuards(AuthGuard, RbacGuard)
    @RequireAccess('finance_report')
    async report(@Body() body: any) {
        const res = await this.svc.report(body)
        return { ok: true, data: res }
    }

    @Post('risk')
    @UseGuards(AuthGuard, RbacGuard)
    @RequireAccess('finance_risk')
    async risk(@Body() body: any) {
        const res = await this.svc.risk(body)
        return { ok: true, data: res }
    }
}
