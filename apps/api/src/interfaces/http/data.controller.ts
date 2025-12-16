import { Controller, Get, Post, Put, Delete, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { DataService } from '../../modules/data/data.service'
import { RequireAccess, RbacGuard } from '../../shared/security/rbac.guard'
import { AuthGuard } from '../../shared/security/auth.guard'

@ApiTags('data')
@Controller('data')
export class DataController {
    constructor(private readonly svc: DataService) {}

    @Get()
    @UseGuards(AuthGuard, RbacGuard)
    @RequireAccess('metrics_read')
    async list(@Query() q: any) {
        const res = await this.svc.list(q)
        return { ok: true, data: res }
    }

    @Post()
    async create(@Body() body: any) {
        const res = await this.svc.create(body)
        return { ok: true, data: res }
    }

    @Put()
    async update(@Body() body: any) {
        const res = await this.svc.update(body)
        return { ok: true, data: res }
    }

    @Delete()
    async remove(@Body() body: any) {
        const res = await this.svc.remove(body)
        return { ok: true, data: res }
    }
}
