import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'

export class LoginDto {
  @ApiProperty({
    description: '用户邮箱',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string

  @ApiProperty({
    description: '密码',
    minLength: 8,
    example: 'password123',
  })
  @IsString()
  @MinLength(8, { message: '密码至少8位字符' })
  password!: string
}

export class RegisterDto {
  @ApiProperty({
    description: '用户邮箱',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string

  @ApiProperty({
    description: '密码',
    minLength: 8,
    example: 'password123',
  })
  @IsString()
  @MinLength(8, { message: '密码至少8位字符' })
  password!: string

  @ApiPropertyOptional({
    description: '用户姓名',
    example: '张三',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  fullName?: string
}

export class ChangePasswordDto {
  @ApiProperty({
    description: '当前密码',
    example: 'password123',
  })
  @IsString()
  @MinLength(8, { message: '密码至少8位字符' })
  currentPassword!: string

  @ApiProperty({
    description: '新密码',
    minLength: 8,
    example: 'newpassword456',
  })
  @IsString()
  @MinLength(8, { message: '新密码至少8位字符' })
  newPassword!: string
}

export class UserResponseDto {
  @ApiProperty({
    description: '用户ID',
    example: 1,
  })
  id!: number

  @ApiProperty({
    description: '用户邮箱',
    example: 'user@example.com',
  })
  email!: string

  @ApiPropertyOptional({
    description: '用户姓名',
    example: '张三',
  })
  fullName?: string

  @ApiProperty({
    description: '是否激活',
    example: true,
  })
  @IsBoolean()
  isActive!: boolean

  @ApiProperty({
    description: '是否超级用户',
    example: false,
  })
  @IsBoolean()
  isSuperuser!: boolean

  @ApiProperty({
    description: '创建时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date

  @ApiProperty({
    description: '更新时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date
}

export class AuthResponseDto {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token!: string

  @ApiProperty({
    description: '用户信息',
    type: UserResponseDto,
  })
  user!: UserResponseDto
}