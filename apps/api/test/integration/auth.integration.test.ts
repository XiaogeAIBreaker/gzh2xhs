import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../../../src/modules/app.module'
import { DataSource } from 'typeorm'
import { UserEntity } from '../../../src/infrastructure/database/repositories/user.repository'

describe('Auth Integration Tests', () => {
  let app: INestApplication
  let dataSource: DataSource

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    dataSource = moduleFixture.get<DataSource>(DataSource)
    
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    // 清理数据库
    await dataSource.getRepository(UserEntity).clear()
  })

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      }

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.email).toBe('test@example.com')
      expect(response.body.fullName).toBe('Test User')
      expect(response.body).not.toHaveProperty('password')
      expect(response.body.isActive).toBe(true)
      expect(response.body.isSuperuser).toBe(false)
    })

    it('should return 409 for duplicate email', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'password123',
        fullName: 'Test User',
      }

      // 第一次注册
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)

      // 第二次注册相同邮箱
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409)

      expect(response.body.message).toContain('Email already exists')
    })

    it('should return 400 for invalid email format', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'password123',
      }

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400)

      expect(response.body.message).toContain('email')
    })

    it('should return 400 for weak password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: '123',
      }

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400)

      expect(response.body.message).toContain('password')
    })
  })

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // 创建一个测试用户
      const registerDto = {
        email: 'login@example.com',
        password: 'password123',
        fullName: 'Login User',
      }

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
    })

    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: 'login@example.com',
        password: 'password123',
      }

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)

      expect(response.body).toHaveProperty('access_token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe('login@example.com')
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should return 401 for invalid credentials', async () => {
      const loginDto = {
        email: 'login@example.com',
        password: 'wrongpassword',
      }

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401)

      expect(response.body.message).toContain('Invalid credentials')
    })

    it('should return 401 for non-existent user', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      }

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401)

      expect(response.body.message).toContain('Invalid credentials')
    })

    it('should return 401 for inactive user', async () => {
      // 先注册用户
      const registerDto = {
        email: 'inactive@example.com',
        password: 'password123',
        fullName: 'Inactive User',
      }

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)

      // 手动设置为非活跃状态（实际应用中应该通过管理员接口）
      await dataSource.getRepository(UserEntity).update(
        { email: 'inactive@example.com' },
        { isActive: false }
      )

      // 尝试登录
      const loginDto = {
        email: 'inactive@example.com',
        password: 'password123',
      }

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401)

      expect(response.body.message).toContain('User is inactive')
    })
  })

  describe('GET /auth/me', () => {
    let authToken: string

    beforeEach(async () => {
      // 注册并登录获取token
      const registerDto = {
        email: 'me@example.com',
        password: 'password123',
        fullName: 'Me User',
      }

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'me@example.com',
          password: 'password123',
        })

      authToken = loginResponse.body.access_token
    })

    it('should get current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('id')
      expect(response.body.email).toBe('me@example.com')
      expect(response.body.fullName).toBe('Me User')
      expect(response.body).not.toHaveProperty('password')
    })

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401)
    })

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
    })
  })

  describe('POST /auth/change-password', () => {
    let authToken: string

    beforeEach(async () => {
      // 注册并登录获取token
      const registerDto = {
        email: 'changepwd@example.com',
        password: 'password123',
        fullName: 'Change Password User',
      }

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'changepwd@example.com',
          password: 'password123',
        })

      authToken = loginResponse.body.access_token
    })

    it('should change password successfully', async () => {
      const changePasswordDto = {
        currentPassword: 'password123',
        newPassword: 'newpassword456',
      }

      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(changePasswordDto)
        .expect(201)

      // 验证新密码可以登录
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'changepwd@example.com',
          password: 'newpassword456',
        })

      expect(loginResponse.status).toBe(200)
      expect(loginResponse.body).toHaveProperty('access_token')
    })

    it('should return 401 with wrong current password', async () => {
      const changePasswordDto = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword456',
      }

      const response = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(changePasswordDto)
        .expect(401)

      expect(response.body.message).toContain('Current password is incorrect')
    })

    it('should return 401 without token', async () => {
      const changePasswordDto = {
        currentPassword: 'password123',
        newPassword: 'newpassword456',
      }

      await request(app.getHttpServer())
        .post('/auth/change-password')
        .send(changePasswordDto)
        .expect(401)
    })
  })
})