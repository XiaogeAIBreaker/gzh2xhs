export type UserRole = 'admin' | 'user'

export type UserDto = {
    id: string
    email: string
    role: UserRole
}

export type RegisterRequestDto = {
    email: string
    password: string
}

export type LoginRequestDto = {
    email: string
    password: string
}
