import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { ApiBody, ApiTags } from '@nestjs/swagger'
import { GenerateInputDto } from '../../modules/generate/dto/generate-input.dto'
import { GenerateService } from '../../modules/generate/generate.service'
import { RequireAccess, RbacGuard } from '../../shared/security/rbac.guard'
import { AuthGuard } from '../../shared/security/auth.guard'

@ApiTags('generate')
@Controller('generate')
export class GenerateController {
    constructor(private readonly svc: GenerateService) {
        void 0
    }

    @Post()
    @UseGuards(AuthGuard, RbacGuard)
    @RequireAccess('card_generate')
    @ApiBody({ type: GenerateInputDto })
    async generate(@Body() input: GenerateInputDto) {
        const result = await this.svc.generate(input)
        return { ok: true, data: result }
    }
}
