import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { User } from '../entities/user.entity'
import { UserRepository } from '../repositories/user.repository.interface'
import {
  UserRegisteredEvent,
  UserActivatedEvent,
  UserDeactivatedEvent,
  PasswordChangedEvent,
  SuperuserGrantedEvent,
  SuperuserRevokedEvent,
} from '../events/auth.events'

export interface UserDomainServiceOptions {
  enableEventPublishing?: boolean
}

/**
 * 用户领域服务
 * 封装用户相关的业务规则和逻辑
 */
@Injectable()
export class UserDomainService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventEmitter?: EventEmitter2,
  ) {}

  /**
   * 创建用户
   */
  async createUser(
    email: string,
    password: string,
    fullName?: string,
    options: UserDomainServiceOptions = {},
  ): Promise<User> {
    // 检查邮箱是否已存在
    const existingUser = await this.userRepository.findByEmail(email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // 创建用户
    const user = User.create({
      email,
      password,
      fullName,
    })

    const savedUser = await this.userRepository.save(user)

    // 发布领域事件
    if (options.enableEventPublishing && this.eventEmitter) {
      this.eventEmitter.emit(
        'user.registered',
        new UserRegisteredEvent(
          savedUser.id!,
          savedUser.email,
          savedUser.fullName || undefined,
        ),
      )
    }

    return savedUser
  }

  /**
   * 激活用户
   */
  async activateUser(userId: number, options: UserDomainServiceOptions = {}): Promise<User> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const activatedUser = user.activate()
    const savedUser = await this.userRepository.save(activatedUser)

    // 发布领域事件
    if (options.enableEventPublishing && this.eventEmitter) {
      this.eventEmitter.emit(
        'user.activated',
        new UserActivatedEvent(savedUser.id!, savedUser.email),
      )
    }

    return savedUser
  }

  /**
   * 停用用户
   */
  async deactivateUser(userId: number, options: UserDomainServiceOptions = {}): Promise<User> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const deactivatedUser = user.deactivate()
    const savedUser = await this.userRepository.save(deactivatedUser)

    // 发布领域事件
    if (options.enableEventPublishing && this.eventEmitter) {
      this.eventEmitter.emit(
        'user.deactivated',
        new UserDeactivatedEvent(savedUser.id!, savedUser.email),
      )
    }

    return savedUser
  }

  /**
   * 修改密码
   */
  async changePassword(
    userId: number,
    newPassword: string,
    options: UserDomainServiceOptions = {},
  ): Promise<User> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const userWithNewPassword = await user.changePassword(newPassword)
    const savedUser = await this.userRepository.save(userWithNewPassword)

    // 发布领域事件
    if (options.enableEventPublishing && this.eventEmitter) {
      this.eventEmitter.emit(
        'password.changed',
        new PasswordChangedEvent(savedUser.id!, savedUser.email),
      )
    }

    return savedUser
  }

  /**
   * 赋予超级用户权限
   */
  async grantSuperuser(
    userId: number,
    options: UserDomainServiceOptions = {},
  ): Promise<User> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const superuser = user.grantSuperuser()
    const savedUser = await this.userRepository.save(superuser)

    // 发布领域事件
    if (options.enableEventPublishing && this.eventEmitter) {
      this.eventEmitter.emit('superuser.granted', new SuperuserGrantedEvent(savedUser.id!, savedUser.email))
    }

    return savedUser
  }

  /**
   * 移除超级用户权限
   */
  async revokeSuperuser(
    userId: number,
    options: UserDomainServiceOptions = {},
  ): Promise<User> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const regularUser = user.revokeSuperuser()
    const savedUser = await this.userRepository.save(regularUser)

    // 发布领域事件
    if (options.enableEventPublishing && this.eventEmitter) {
      this.eventEmitter.emit('superuser.revoked', new SuperuserRevokedEvent(savedUser.id!, savedUser.email))
    }

    return savedUser
  }

  /**
   * 验证用户凭据
   */
  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email)
    if (!user || !user.isActive) {
      return null
    }

    const isValidPassword = await user.validatePassword(password)
    if (!isValidPassword) {
      return null
    }

    return user
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(): Promise<{
    total: number
    active: number
    superusers: number
  }> {
    const [total, active, superusers] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.countActive(),
      this.userRepository.findSuperusers(),
    ])

    return {
      total,
      active,
      superusers: superusers.length,
    }
  }
}