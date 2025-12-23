import { createHash } from 'crypto'
import type { UserDto } from '@/types/user'

/**
 *
 */
export class UserRepository {
    private users = new Map<string, { user: UserDto; passwordHash: string }>()

    private hash(pw: string) {
        return createHash('sha256').update(pw).digest('hex')
    }

    /**
     *
     */
    async create(email: string, password: string, role: UserDto['role'] = 'user') {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const user: UserDto = { id, email, role }
        this.users.set(email.toLowerCase(), { user, passwordHash: this.hash(password) })
        return user
    }

    /**
     *
     */
    async findByEmail(email: string): Promise<UserDto | null> {
        const rec = this.users.get(email.toLowerCase())
        return rec ? rec.user : null
    }

    /**
     *
     */
    async verify(email: string, password: string): Promise<UserDto | null> {
        const rec = this.users.get(email.toLowerCase())
        if (!rec) return null
        const ok = rec.passwordHash === this.hash(password)
        return ok ? rec.user : null
    }
}

export const userRepo = new UserRepository()
