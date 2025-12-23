import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { JwtService } from '@nestjs/jwt'
import { getRepositoryToken } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import * as bcrypt from 'bcrypt'

jest.mock('bcrypt', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}))

describe('AuthService', () => {
    let service: AuthService
    let repo: any
    let jwtService: any

    beforeEach(async () => {
        repo = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        }
        jwtService = {
            sign: jest.fn(),
        }

        const testingModule: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getRepositoryToken(User),
                    useValue: repo,
                },
                {
                    provide: JwtService,
                    useValue: jwtService,
                },
            ],
        }).compile()

        service = testingModule.get<AuthService>(AuthService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('validateUser', () => {
        it('should return user without password if valid', async () => {
            const user = {
                id: 1,
                email: 'test@test.com',
                password: 'hash',
                fullName: 'Test',
                isActive: true,
            }
            ;(repo.findOne as jest.Mock).mockResolvedValue(user)
            ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

            const result = await service.validateUser('test@test.com', 'pass')
            expect(result).toEqual({
                id: 1,
                email: 'test@test.com',
                fullName: 'Test',
                isActive: true,
            })
        })

        it('should return null if password invalid', async () => {
            const user = { id: 1, email: 'test@test.com', password: 'hash' }
            ;(repo.findOne as jest.Mock).mockResolvedValue(user)
            ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

            const result = await service.validateUser('test@test.com', 'wrong')
            expect(result).toBeNull()
        })
    })

    describe('login', () => {
        it('should return token', async () => {
            const user = { id: 1, email: 'test@test.com', isSuperuser: false, isActive: true }
            // Mock validateUser on the instance
            jest.spyOn(service, 'validateUser').mockResolvedValue(user)
            jwtService.sign.mockReturnValue('token')

            const result = await service.login({ email: 'test@test.com', password: 'pass' })
            expect(result).toEqual({ access_token: 'token', user })
        })
    })

    describe('register', () => {
        it('should create user', async () => {
            repo.findOne.mockResolvedValue(null)
            ;(bcrypt.hash as jest.Mock).mockResolvedValue('hash')
            repo.create.mockReturnValue({ id: 1, email: 'new@test.com', password: 'hash' })
            repo.save.mockResolvedValue({ id: 1, email: 'new@test.com', password: 'hash' })

            const result = await service.register({ email: 'new@test.com', password: 'pass' })
            expect(result).toEqual({ id: 1, email: 'new@test.com' })
        })
    })
})
