import { Repository } from '../../../shared/orm/repository'
import { GenerateItem } from '../entities/item.entity'

export class InMemoryItemRepo implements Repository<GenerateItem> {
    private readonly store = new Map<string, GenerateItem>()
    async findById(id: string): Promise<GenerateItem | null> {
        return this.store.get(id) ?? null
    }
    async findAll(): Promise<GenerateItem[]> {
        return Array.from(this.store.values())
    }
    async save(entity: GenerateItem): Promise<GenerateItem> {
        if (!entity.id) entity.id = Math.random().toString(36).slice(2)
        entity.createdAt = entity.createdAt ?? new Date()
        this.store.set(entity.id, entity)
        return entity
    }
    async delete(id: string): Promise<void> {
        this.store.delete(id)
    }
}
