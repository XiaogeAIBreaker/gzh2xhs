import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../shared/security/auth.guard'
import { LoginUseCase, RegisterUseCase, GetCurrentUserUseCase, ChangePasswordUseCase } from '../../application/usecases/auth.usecases'
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  AuthResponseDto,
  UserResponseDto,
} from './dto/auth.dto'

@ApiTags('认证模块')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: '用户注册',
    description: '创建新的用户账户',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: '注册成功',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '邮箱已存在',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  async register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
    const result = await this.registerUseCase.execute(registerDto)
    return this.mapUserToResponse(result.user)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用户登录',
    description: '使用邮箱和密码登录系统',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '凭据无效',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    const result = await this.loginUseCase.execute(loginDto)
    return {
      access_token: result.accessToken,
      user: this.mapUserToResponse(result.user),
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取当前用户信息',
    description: '获取当前登录用户的详细信息',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '未授权',
  })
  async getCurrentUser(@Request() req: { user: { sub: number } }): Promise<UserResponseDto> {
    const result = await this.getCurrentUserUseCase.execute({
      userId: req.user.sub,
    })
    return this.mapUserToResponse(result.user!)
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '修改密码',
    description: '修改当前用户的登录密码',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 201,
    description: '密码修改成功',
  })
  @ApiResponse({
    status: 401,
    description: '当前密码错误或未授权',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.changePasswordUseCase.execute({
      userId: req.user.sub,
      currentPassword: changePasswordDto.currentPassword,
      newPassword: changePasswordDto.newPassword,
    })
    return { message: '密码修改成功' }
  }

  private mapUserToResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      isSuperuser: user.isSuperuser,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
