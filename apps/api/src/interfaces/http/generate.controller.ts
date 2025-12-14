import { Controller, Post, Body } from '@nestjs/common'
import { ApiBody, ApiTags } from '@nestjs/swagger'
import { GenerateInputDto } from '../../modules/generate/dto/generate-input.dto'
import { GenerateService } from '../../modules/generate/generate.service'

@ApiTags('generate')
@Controller('generate')
export class GenerateController {
    constructor(private readonly svc: GenerateService) {
        void 0
    }

    @Post()
    @ApiBody({ type: GenerateInputDto })
    async generate(@Body() input: GenerateInputDto) {
        const result = await this.svc.generate(input)
        return { ok: true, data: result }
    }
}
