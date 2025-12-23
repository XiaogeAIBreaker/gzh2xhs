import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

/**
 *
 */
@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ unique: true })
    email!: string

    @Column({ select: false }) // Don't return password by default
    password!: string

    @Column({ nullable: true })
    fullName!: string

    @Column({ default: true })
    isActive!: boolean

    @Column({ default: false })
    isSuperuser!: boolean

    @CreateDateColumn()
    createdAt!: Date

    @UpdateDateColumn()
    updatedAt!: Date
}
