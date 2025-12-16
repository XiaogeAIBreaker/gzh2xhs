import { Controller, Get, Post, Body } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AuthService } from '../../modules/auth/auth.service'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly svc: AuthService) {}

    @Post('login')
    async login(@Body() body: any) {
        const res = await this.svc.login(body)
        return { ok: true, data: res }
    }

    @Post('register')
    async register(@Body() body: any) {
        const res = await this.svc.register(body)
        return { ok: true, data: res }
    }

    @Get('me')
    async me() {
        const res = await this.svc.me()
        return { ok: true, data: res }
    }
}
