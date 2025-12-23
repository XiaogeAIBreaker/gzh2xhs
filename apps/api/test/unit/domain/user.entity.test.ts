import { describe, it, expect } from 'vitest'
import { User, Email, Password } from '../../../src/domain/entities/user.entity'
import { DomainException } from '../../../src/shared/exceptions/domain.exception'

describe('User Entity', () => {
  describe('create', () => {
    it('should create a user with valid data', () => {
      const user = User.create({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      })

      expect(user.email).toBe('test@example.com')
      expect(user.fullName).toBe('Test User')
      expect(user.isActive).toBe(true)
      expect(user.isSuperuser).toBe(false)
      expect(user.id).toBeNull()
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it('should create user with default values', () => {
      const user = User.create({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(user.fullName).toBeNull()
      expect(user.isActive).toBe(true)
      expect(user.isSuperuser).toBe(false)
    })

    it('should create user with provided values', () => {
      const user = User.create({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        isActive: false,
        isSuperuser: true,
      })

      expect(user.fullName).toBe('Test User')
      expect(user.isActive).toBe(false)
      expect(user.isSuperuser).toBe(true)
    })
  })

  describe('reconstruct', () => {
    it('should reconstruct user from persisted data', () => {
      const createdAt = new Date('2024-01-01')
      const updatedAt = new Date('2024-01-02')
      
      const user = User.reconstruct(
        1,
        'test@example.com',
        'hashedpassword',
        'Test User',
        true,
        false,
        createdAt,
        updatedAt,
      )

      expect(user.id).toBe(1)
      expect(user.email).toBe('test@example.com')
      expect(user.password).toBe('hashedpassword')
      expect(user.fullName).toBe('Test User')
      expect(user.isActive).toBe(true)
      expect(user.isSuperuser).toBe(false)
      expect(user.createdAt).toEqual(createdAt)
      expect(user.updatedAt).toEqual(updatedAt)
    })
  })

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      const user = User.create({
        email: 'test@example.com',
        password: 'password123',
      })

      // Password hashing is handled asynchronously
      const isValid = await user.validatePassword('password123')
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const user = User.create({
        email: 'test@example.com',
        password: 'password123',
      })

      const isValid = await user.validatePassword('wrongpassword')
      expect(isValid).toBe(false)
    })
  })

  describe('changePassword', () => {
    it('should change password', async () => {
      const user = User.create({
        email: 'test@example.com',
        password: 'oldpassword',
      })

      const userWithNewPassword = await user.changePassword('newpassword')
      
      expect(userWithNewPassword.password).not.toBe('oldpassword')
      expect(await userWithNewPassword.validatePassword('newpassword')).toBe(true)
      expect(await userWithNewPassword.validatePassword('oldpassword')).toBe(false)
    })
  })

  describe('activate', () => {
    it('should activate inactive user', () => {
      const inactiveUser = User.create({
        email: 'test@example.com',
        password: 'password123',
        isActive: false,
      })

      const activatedUser = inactiveUser.activate()
      
      expect(activatedUser.isActive).toBe(true)
      expect(activatedUser.updatedAt).not.toEqual(inactiveUser.updatedAt)
    })

    it('should throw error when activating already active user', () => {
      const activeUser = User.create({
        email: 'test@example.com',
        password: 'password123',
        isActive: true,
      })

      expect(() => activeUser.activate()).toThrow(DomainException)
      expect(() => activeUser.activate()).toThrow('User is already active')
    })
  })

  describe('deactivate', () => {
    it('should deactivate active user', () => {
      const activeUser = User.create({
        email: 'test@example.com',
        password: 'password123',
        isActive: true,
      })

      const deactivatedUser = activeUser.deactivate()
      
      expect(deactivatedUser.isActive).toBe(false)
      expect(deactivatedUser.updatedAt).not.toEqual(activeUser.updatedAt)
    })

    it('should throw error when deactivating already inactive user', () => {
      const inactiveUser = User.create({
        email: 'test@example.com',
        password: 'password123',
        isActive: false,
      })

      expect(() => inactiveUser.deactivate()).toThrow(DomainException)
      expect(() => inactiveUser.deactivate()).toThrow('User is already inactive')
    })
  })

  describe('grantSuperuser', () => {
    it('should grant superuser privileges', () => {
      const regularUser = User.create({
        email: 'test@example.com',
        password: 'password123',
        isSuperuser: false,
      })

      const superuser = regularUser.grantSuperuser()
      
      expect(superuser.isSuperuser).toBe(true)
      expect(superuser.updatedAt).not.toEqual(regularUser.updatedAt)
    })

    it('should throw error when granting to already superuser', () => {
      const superuser = User.create({
        email: 'test@example.com',
        password: 'password123',
        isSuperuser: true,
      })

      expect(() => superuser.grantSuperuser()).toThrow(DomainException)
      expect(() => superuser.grantSuperuser()).toThrow('User is already a superuser')
    })
  })

  describe('revokeSuperuser', () => {
    it('should revoke superuser privileges', () => {
      const superuser = User.create({
        email: 'test@example.com',
        password: 'password123',
        isSuperuser: true,
      })

      const regularUser = superuser.revokeSuperuser()
      
      expect(regularUser.isSuperuser).toBe(false)
      expect(regularUser.updatedAt).not.toEqual(superuser.updatedAt)
    })

    it('should throw error when revoking from regular user', () => {
      const regularUser = User.create({
        email: 'test@example.com',
        password: 'password123',
        isSuperuser: false,
      })

      expect(() => regularUser.revokeSuperuser()).toThrow(DomainException)
      expect(() => regularUser.revokeSuperuser()).toThrow('User is not a superuser')
    })
  })

  describe('isAdmin', () => {
    it('should return true for superuser', () => {
      const superuser = User.create({
        email: 'test@example.com',
        password: 'password123',
        isSuperuser: true,
      })

      expect(superuser.isAdmin()).toBe(true)
    })

    it('should return false for regular user', () => {
      const regularUser = User.create({
        email: 'test@example.com',
        password: 'password123',
        isSuperuser: false,
      })

      expect(regularUser.isAdmin()).toBe(false)
    })
  })

  describe('canPerform', () => {
    it('should allow admin actions for superuser', () => {
      const superuser = User.create({
        email: 'test@example.com',
        password: 'password123',
        isSuperuser: true,
      })

      expect(superuser.canPerform('admin')).toBe(true)
    })

    it('should not allow admin actions for inactive user', () => {
      const inactiveUser = User.create({
        email: 'test@example.com',
        password: 'password123',
        isActive: false,
      })

      expect(inactiveUser.canPerform('admin')).toBe(false)
    })

    it('should allow basic actions for active users', () => {
      const activeUser = User.create({
        email: 'test@example.com',
        password: 'password123',
        isActive: true,
      })

      expect(activeUser.canPerform('read')).toBe(true)
    })
  })
})

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create email with valid format', () => {
      const email = Email.create('test@example.com')
      expect(email.value).toBe('test@example.com')
    })

    it('should normalize email to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM')
      expect(email.value).toBe('test@example.com')
    })

    it('should trim whitespace', () => {
      const email = Email.create('  test@example.com  ')
      expect(email.value).toBe('test@example.com')
    })

    it('should throw error for empty email', () => {
      expect(() => Email.create('')).toThrow(DomainException)
      expect(() => Email.create('  ')).toThrow(DomainException)
    })

    it('should throw error for invalid email format', () => {
      expect(() => Email.create('invalid-email')).toThrow()
      expect(() => Email.create('test@')).toThrow()
    })
  })

  describe('equals', () => {
    it('should consider emails equal regardless of case', () => {
      const email1 = Email.create('test@example.com')
      const email2 = Email.create('TEST@EXAMPLE.COM')
      
      expect(email1.equals(email2)).toBe(true)
    })
  })
})

describe('Password Value Object', () => {
  describe('create', () => {
    it('should create password with valid length', () => {
      const password = Password.create('password123')
      expect(password.value).toBe('password123')
      expect(password.isHashed).toBe(false)
    })

    it('should throw error for password too short', () => {
      expect(() => Password.create('1234567')).toThrow(DomainException)
    })

    it('should create hashed password', () => {
      const hashedPassword = Password.createHashed('hashedvalue123')
      expect(hashedPassword.value).toBe('hashedvalue123')
      expect(hashedPassword.isHashed).toBe(true)
    })
  })

  describe('validate', () => {
    it('should validate plain password against itself', async () => {
      const password = Password.create('password123')
      expect(await password.validate('password123')).toBe(true)
      expect(await password.validate('wrong')).toBe(false)
    })

    it('should validate hashed password using bcrypt', async () => {
      const bcrypt = await import('bcrypt')
      const hashed = await bcrypt.hash('password123', 10)
      const password = Password.createHashed(hashed)
      
      expect(await password.validate('password123')).toBe(true)
      expect(await password.validate('wrong')).toBe(false)
    })
  })

  describe('hash', () => {
    it('should hash plain password', async () => {
      const password = Password.create('password123')
      const hashed = await password.hash()
      
      expect(hashed).not.toBe('password123')
      expect(hashed.length).toBeGreaterThan(50) // bcrypt hash length
    })

    it('should return hashed password as is', async () => {
      const originalHash = 'existinghash123'
      const password = Password.createHashed(originalHash)
      const hashed = await password.hash()
      
      expect(hashed).toBe(originalHash)
    })
  })
})