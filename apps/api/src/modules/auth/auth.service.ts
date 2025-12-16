import { Injectable } from '@nestjs/common'

@Injectable()
export class AuthService {
    async login(_input: any) {
        return { token: 'admin-token' }
    }
    async register(_input: any) {
        return { id: 'user' }
    }
    async me() {
        return { id: 'user', role: 'user' }
    }
}
