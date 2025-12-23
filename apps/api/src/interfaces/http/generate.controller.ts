import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { ApiBody, ApiTags } from '@nestjs/swagger'
import { GenerateInputDto } from '../../modules/generate/dto/generate-input.dto'
import { GenerateService } from '../../modules/generate/generate.service'
import { RequireAccess, RbacGuard } from '../../shared/security/rbac.guard'
import { AuthGuard } from '../../shared/security/auth.guard'

@ApiTags('generate')
@Controller('generate')
export class GenerateController {
    constructor(private readonly svc: GenerateService) {}

    @Post()
    @UseGuards(AuthGuard, RbacGuard)
    @RequireAccess('card_generate')
    @ApiBody({ type: GenerateInputDto })
    async generate(@Body() input: GenerateInputDto) {
        // Return result directly to match existing API contract
        return await this.svc.generate(input)
    }
}
