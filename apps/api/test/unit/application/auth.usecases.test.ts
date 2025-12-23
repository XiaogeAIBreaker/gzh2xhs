import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginUseCase, RegisterUseCase, GetCurrentUserUseCase, ChangePasswordUseCase } from '../../../../src/application/usecases/auth.usecases'
import { UserDomainService } from '../../../../src/domain/services/user.domain.service'
import { JwtService } from '@nestjs/jwt'
import { UnauthorizedException } from '@nestjs/common'

// Mock JwtService
const mockJwtService = {
  signAsync: vi.fn(),
} as unknown as JwtService

// Mock UserDomainService
const mockUserDomainService = {
  validateCredentials: vi.fn(),
  createUser: vi.fn(),
  changePassword: vi.fn(),
  userRepository: {
    findById: vi.fn(),
  },
}

describe('Auth Use Cases', () => {
  let loginUseCase: LoginUseCase
  let registerUseCase: RegisterUseCase
  let getCurrentUserUseCase: GetCurrentUserUseCase
  let changePasswordUseCase: ChangePasswordUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    
    loginUseCase = new LoginUseCase(mockUserDomainService, mockJwtService)
    registerUseCase = new RegisterUseCase(mockUserDomainService)
    getCurrentUserUseCase = new GetCurrentUserUseCase(mockUserDomainService)
    changePasswordUseCase = new ChangePasswordUseCase(mockUserDomainService)
  })

  describe('LoginUseCase', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isSuperuser: false,
        isActive: true,
      } as any

      mockUserDomainService.validateCredentials.mockResolvedValue(mockUser)
      mockJwtService.signAsync.mockResolvedValue('mock-jwt-token')

      const input = {
        email: 'test@example.com',
        password: 'password123',
      }

      // Act
      const result = await loginUseCase.execute(input)

      // Assert
      expect(mockUserDomainService.validateCredentials).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      )
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        email: 'test@example.com',
        role: 'user',
      })
      expect(result.user).toEqual(mockUser)
      expect(result.accessToken).toBe('mock-jwt-token')
    })

    it('should throw error for invalid credentials', async () => {
      // Arrange
      mockUserDomainService.validateCredentials.mockResolvedValue(null)

      const input = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      // Act & Assert
      await expect(loginUseCase.execute(input)).rejects.toThrow(UnauthorizedException)
      expect(mockUserDomainService.validateCredentials).toHaveBeenCalledWith(
        'test@example.com',
        'wrongpassword',
      )
    })

    it('should set admin role for superuser', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'admin@example.com',
        isSuperuser: true,
        isActive: true,
      } as any

      mockUserDomainService.validateCredentials.mockResolvedValue(mockUser)
      mockJwtService.signAsync.mockResolvedValue('admin-jwt-token')

      const input = {
        email: 'admin@example.com',
        password: 'admin123',
      }

      // Act
      const result = await loginUseCase.execute(input)

      // Assert
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        email: 'admin@example.com',
        role: 'admin',
      })
      expect(result.accessToken).toBe('admin-jwt-token')
    })
  })

  describe('RegisterUseCase', () => {
    it('should register user successfully', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'newuser@example.com',
        fullName: 'New User',
        isActive: true,
        isSuperuser: false,
      } as any

      mockUserDomainService.createUser.mockResolvedValue(mockUser)

      const input = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
      }

      // Act
      const result = await registerUseCase.execute(input)

      // Assert
      expect(mockUserDomainService.createUser).toHaveBeenCalledWith(
        'newuser@example.com',
        'password123',
        'New User',
        { enableEventPublishing: true },
      )
      expect(result.user).toEqual(mockUser)
    })
  })

  describe('GetCurrentUserUseCase', () => {
    it('should get current user successfully', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: true,
      } as any

      mockUserDomainService.userRepository.findById.mockResolvedValue(mockUser)

      const input = {
        userId: 1,
      }

      // Act
      const result = await getCurrentUserUseCase.execute(input)

      // Assert
      expect(mockUserDomainService.userRepository.findById).toHaveBeenCalledWith(1)
      expect(result.user).toEqual(mockUser)
    })

    it('should return null for non-existent user', async () => {
      // Arrange
      mockUserDomainService.userRepository.findById.mockResolvedValue(null)

      const input = {
        userId: 999,
      }

      // Act
      const result = await getCurrentUserUseCase.execute(input)

      // Assert
      expect(result.user).toBeNull()
    })
  })

  describe('ChangePasswordUseCase', () => {
    it('should change password successfully', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        validatePassword: vi.fn().mockResolvedValue(true),
      } as any

      mockUserDomainService.userRepository.findById.mockResolvedValue(mockUser)

      const input = {
        userId: 1,
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      }

      // Act
      await changePasswordUseCase.execute(input)

      // Assert
      expect(mockUserDomainService.userRepository.findById).toHaveBeenCalledWith(1)
      expect(mockUser.validatePassword).toHaveBeenCalledWith('oldpassword')
      expect(mockUserDomainService.changePassword).toHaveBeenCalledWith(
        1,
        'newpassword',
        { enableEventPublishing: true },
      )
    })

    it('should throw error for non-existent user', async () => {
      // Arrange
      mockUserDomainService.userRepository.findById.mockResolvedValue(null)

      const input = {
        userId: 999,
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      }

      // Act & Assert
      await expect(changePasswordUseCase.execute(input)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw error for incorrect current password', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        validatePassword: vi.fn().mockResolvedValue(false),
      } as any

      mockUserDomainService.userRepository.findById.mockResolvedValue(mockUser)

      const input = {
        userId: 1,
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword',
      }

      // Act & Assert
      await expect(changePasswordUseCase.execute(input)).rejects.toThrow(
        UnauthorizedException,
      )
      expect(mockUserDomainService.changePassword).not.toHaveBeenCalled()
    })
  })
})