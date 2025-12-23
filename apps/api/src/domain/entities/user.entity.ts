import { IsEmail, IsString, MinLength, IsBoolean, IsOptional } from 'class-validator'
import { DomainException } from '../../shared/exceptions/domain.exception'

export interface CreateUserProps {
  email: string
  password: string
  fullName?: string
  isActive?: boolean
  isSuperuser?: boolean
}

/**
 * 用户实体 - 领域层
 * 负责用户相关的业务规则和数据状态管理
 */
export class User {
  private constructor(
    private readonly _id: number | null,
    private readonly _email: Email,
    private readonly _password: Password,
    private readonly _fullName: string | null,
    private readonly _isActive: boolean,
    private readonly _isSuperuser: boolean,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  /**
   * 创建用户实体
   */
  static create(props: CreateUserProps): User {
    const email = new Email(props.email)
    const password = new Password(props.password)

    const now = new Date()
    return new User(
      null,
      email,
      password,
      props.fullName || null,
      props.isActive ?? true,
      props.isSuperuser ?? false,
      now,
      now,
    )
  }

  /**
   * 从持久化数据重构用户实体
   */
  static reconstruct(
    id: number,
    email: string,
    password: string,
    fullName?: string | null,
    isActive: boolean = true,
    isSuperuser: boolean = false,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): User {
    return new User(
      null,
      Email.create(email),
      Password.createHashed(password),
      fullName || null,
      isActive,
      isSuperuser,
      createdAt,
      updatedAt,
    )
  }

  // Getter 方法
  get id(): number | null {
    return this._id
  }

  get email(): string {
    return this._email.value
  }

  get password(): string {
    return this._password.value
  }

  get fullName(): string | null {
    return this._fullName
  }

  get isActive(): boolean {
    return this._isActive
  }

  get isSuperuser(): boolean {
    return this._isSuperuser
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * 验证密码
   */
  async validatePassword(plainPassword: string): Promise<boolean> {
    return this._password.validate(plainPassword)
  }

  /**
   * 更改密码
   */
  changePassword(newPassword: string): User {
    const password = new Password(newPassword)
    return new User(
      this._id,
      this._email,
      password,
      this._fullName,
      this._isActive,
      this._isSuperuser,
      this._createdAt,
      new Date(),
    )
  }

  /**
   * 激活用户
   */
  activate(): User {
    if (this._isActive) {
      throw new DomainException('User is already active')
    }
    return new User(
      this._id,
      this._email,
      this._password,
      this._fullName,
      true,
      this._isSuperuser,
      this._createdAt,
      new Date(),
    )
  }

  /**
   * 停用用户
   */
  deactivate(): User {
    if (!this._isActive) {
      throw new DomainException('User is already inactive')
    }
    return new User(
      this._id,
      this._email,
      this._password,
      this._fullName,
      false,
      this._isSuperuser,
      this._createdAt,
      new Date(),
    )
  }

  /**
   * 赋予超级用户权限
   */
  grantSuperuser(): User {
    if (this._isSuperuser) {
      throw new DomainException('User is already a superuser')
    }
    return new User(
      this._id,
      this._email,
      this._password,
      this._fullName,
      this._isActive,
      true,
      this._createdAt,
      new Date(),
    )
  }

  /**
   * 移除超级用户权限
   */
  revokeSuperuser(): User {
    if (!this._isSuperuser) {
      throw new DomainException('User is not a superuser')
    }
    return new User(
      this._id,
      this._email,
      this._password,
      this._fullName,
      this._isActive,
      false,
      this._createdAt,
      new Date(),
    )
  }

  /**
   * 检查是否为管理员
   */
  isAdmin(): boolean {
    return this._isSuperuser
  }

  /**
   * 检查是否可以执行特定操作
   */
  canPerform(action: string): boolean {
    if (!this._isActive) {
      return false
    }

    // 基础权限检查逻辑
    switch (action) {
      case 'admin':
        return this._isSuperuser
      default:
        return true
    }
  }
}

/**
 * 邮箱值对象
 */
export class Email {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsString()
  private constructor(private readonly _value: string) {
    if (!this._value || this._value.trim() === '') {
      throw new DomainException('Email cannot be empty')
    }
  }

  static create(value: string): Email {
    return new Email(value.toLowerCase().trim())
  }

  get value(): string {
    return this._value
  }

  equals(other: Email): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}

/**
 * 密码值对象
 */
export class Password {
  constructor(
    private readonly _value: string,
    private readonly _isHashed: boolean = false,
  ) {
    if (!this._isHashed && this._value.length < 8) {
      throw new DomainException('Password must be at least 8 characters long')
    }
  }

  static create(plainPassword: string): Password {
    return new Password(plainPassword, false)
  }

  static createHashed(hashedPassword: string): Password {
    return new Password(hashedPassword, true)
  }

  get value(): string {
    return this._value
  }

  get isHashed(): boolean {
    return this._isHashed
  }

  async validate(plainPassword: string): Promise<boolean> {
    if (this._isHashed) {
      // 如果是哈希密码，需要使用bcrypt验证
      const bcrypt = await import('bcrypt')
      return bcrypt.compare(plainPassword, this._value)
    }
    return this._value === plainPassword
  }

  async hash(): Promise<string> {
    if (this._isHashed) {
      return this._value
    }
    const bcrypt = await import('bcrypt')
    return bcrypt.hash(this._value, 10)
  }

  toString(): string {
    return this._isHashed ? '[HASHED]' : '[PLAIN]'
  }
}

/**
 * 用户状态枚举
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

/**
 * 用户角色枚举
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}
