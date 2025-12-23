import { Controller, Get, Post, Body, Request, UnauthorizedException } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { AuthService } from '../../modules/auth/auth.service'
import { LoginDto } from '../../modules/auth/dto/login.dto'
import { RegisterDto } from '../../modules/auth/dto/register.dto'

/**
 *
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
    /**
     *
     */
    constructor(private readonly svc: AuthService) {}

    /**
     *
     */
    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() body: LoginDto) {
        const res = await this.svc.login(body)
        return { ok: true, data: res }
    }

    /**
     *
     */
    @Post('register')
    @ApiOperation({ summary: 'User registration' })
    @ApiResponse({ status: 201, description: 'User created' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    async register(@Body() body: RegisterDto) {
        const res = await this.svc.register(body)
        return { ok: true, data: res }
    }

    /**
     *
     */
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Profile retrieved' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async me(@Request() req: any) {
        const userId = req.user?.id || req.user?.sub
        if (!userId) {
            throw new UnauthorizedException()
        }
        const res = await this.svc.me(Number(userId)) // Assuming ID is number from Entity
        return { ok: true, data: res }
    }
}
