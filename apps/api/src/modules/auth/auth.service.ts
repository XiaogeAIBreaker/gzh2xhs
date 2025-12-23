import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from './entities/user.entity'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

/**
 *
 */
@Injectable()
export class AuthService {
    /**
     *
     */
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
    ) {}

    /**
     *
     */
    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'fullName', 'isSuperuser', 'isActive'],
        })

        if (user && (await bcrypt.compare(pass, user.password))) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...result } = user
            return result
        }
        return null
    }

    /**
     *
     */
    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password)
        if (!user) {
            throw new UnauthorizedException('Invalid credentials')
        }
        if (!user.isActive) {
            throw new UnauthorizedException('User is inactive')
        }

        const payload = {
            email: user.email,
            sub: user.id,
            role: user.isSuperuser ? 'admin' : 'user',
        }
        return {
            access_token: this.jwtService.sign(payload),
            user,
        }
    }

    /**
     *
     */
    async register(registerDto: RegisterDto) {
        const existing = await this.usersRepository.findOne({ where: { email: registerDto.email } })
        if (existing) {
            throw new ConflictException('Email already exists')
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10)
        const user = this.usersRepository.create({
            ...registerDto,
            password: hashedPassword,
        })

        await this.usersRepository.save(user)

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user
        return result
    }

    /**
     *
     */
    async me(userId: number) {
        return this.usersRepository.findOne({ where: { id: userId } })
    }
}
