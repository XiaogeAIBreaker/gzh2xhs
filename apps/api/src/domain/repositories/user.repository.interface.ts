import { User } from '../entities/user.entity'

export interface UserRepository {
  /**
   * 根据ID查找用户
   */
  findById(id: number): Promise<User | null>
  
  /**
   * 根据邮箱查找用户
   */
  findByEmail(email: string): Promise<User | null>
  
  /**
   * 查找所有活跃用户
   */
  findActiveUsers(): Promise<User[]>
  
  /**
   * 查找所有超级用户
   */
  findSuperusers(): Promise<User[]>
  
  /**
   * 保存用户
   */
  save(user: User): Promise<User>
  
  /**
   * 删除用户
   */
  delete(id: number): Promise<void>
  
  /**
   * 检查邮箱是否已存在
   */
  existsByEmail(email: string): Promise<boolean>
  
  /**
   * 统计用户数量
   */
  count(): Promise<number>
  
  /**
   * 统计活跃用户数量
   */
  countActive(): Promise<number>
}