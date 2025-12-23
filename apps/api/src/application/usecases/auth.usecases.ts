import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '../../domain/entities/user.entity'
import { UserDomainService } from '../../domain/services/user.domain.service'
import { UserLoggedInEvent } from '../../domain/events/auth.events'

export interface LoginUseCaseInput {
  email: string
  password: string
  ipAddress?: string
  userAgent?: string
}

export interface LoginUseCaseOutput {
  user: User
  accessToken: string
}

/**
 * 登录用例
 */
@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: LoginUseCaseInput): Promise<LoginUseCaseOutput> {
    const user = await this.userDomainService.validateCredentials(input.email, input.password)
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.isSuperuser ? 'admin' : 'user',
    }

    const accessToken = await this.jwtService.signAsync(payload)

    return {
      user,
      accessToken,
    }
  }
}

export interface RegisterUseCaseInput {
  email: string
  password: string
  fullName?: string
}

export interface RegisterUseCaseOutput {
  user: User
}

/**
 * 注册用例
 */
@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(input: RegisterUseCaseInput): Promise<RegisterUseCaseOutput> {
    const user = await this.userDomainService.createUser(
      input.email,
      input.password,
      input.fullName,
      { enableEventPublishing: true },
    )

    return {
      user,
    }
  }
}

export interface GetCurrentUserUseCaseInput {
  userId: number
}

export interface GetCurrentUserUseCaseOutput {
  user: User | null
}

/**
 * 获取当前用户用例
 */
@Injectable()
export class GetCurrentUserUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(input: GetCurrentUserUseCaseInput): Promise<GetCurrentUserUseCaseOutput> {
    const user = await this.userDomainService.userRepository.findById(input.userId)
    
    return {
      user,
    }
  }
}

export interface ChangePasswordUseCaseInput {
  userId: number
  currentPassword: string
  newPassword: string
}

/**
 * 修改密码用例
 */
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(input: ChangePasswordUseCaseInput): Promise<void> {
    // 验证当前密码
    const user = await this.userDomainService.userRepository.findById(input.userId)
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const isValidPassword = await user.validatePassword(input.currentPassword)
    if (!isValidPassword) {
      throw new UnauthorizedException('Current password is incorrect')
    }

    // 修改密码
    await this.userDomainService.changePassword(input.userId, input.newPassword, {
      enableEventPublishing: true,
    })
  }
}