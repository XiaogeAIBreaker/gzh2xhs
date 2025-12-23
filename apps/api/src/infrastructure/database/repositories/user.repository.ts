import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../../domain/entities/user.entity'
import { UserRepository } from '../../domain/repositories/user.repository.interface'

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findById(id: number): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { id },
    })
    
    return entity ? this.mapToDomain(entity) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { email: email.toLowerCase() },
    })
    
    return entity ? this.mapToDomain(entity) : null
  }

  async findActiveUsers(): Promise<User[]> {
    const entities = await this.repository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    })
    
    return entities.map(entity => this.mapToDomain(entity))
  }

  async findSuperusers(): Promise<User[]> {
    const entities = await this.repository.find({
      where: { isSuperuser: true },
      order: { createdAt: 'DESC' },
    })
    
    return entities.map(entity => this.mapToDomain(entity))
  }

  async save(user: User): Promise<User> {
    const entity = this.mapToEntity(user)
    const saved = await this.repository.save(entity)
    return this.mapToDomain(saved)
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id)
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { email: email.toLowerCase() },
    })
    return count > 0
  }

  async count(): Promise<number> {
    return this.repository.count()
  }

  async countActive(): Promise<number> {
    return this.repository.count({ where: { isActive: true } })
  }

  private mapToDomain(entity: UserEntity): User {
    return User.reconstruct(
      entity.id,
      entity.email,
      entity.password,
      entity.fullName,
      entity.isActive,
      entity.isSuperuser,
      entity.createdAt,
      entity.updatedAt,
    )
  }

  private mapToEntity(user: User): Partial<UserEntity> {
    return {
      id: user.id || undefined,
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      isActive: user.isActive,
      isSuperuser: user.isSuperuser,
    }
  }
}

// TypeORM 实体
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  email!: string

  @Column()
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