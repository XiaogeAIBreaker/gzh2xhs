export type Item = { id: string; [k: string]: any }

export class DataRepository<T extends { id: string }> {
    private store = new Map<string, Map<string, T>>()

    private bucket(type: string) {
        const k = type.toLowerCase()
        if (!this.store.has(k)) this.store.set(k, new Map())
        return this.store.get(k)!
    }

    async create(type: string, item: Omit<T, 'id'>): Promise<T> {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const full = { ...(item as any), id } as T
        this.bucket(type).set(id, full)
        return full
    }

    async get(type: string, id: string): Promise<T | null> {
        return this.bucket(type).get(id) || null
    }

    async update(type: string, id: string, patch: Partial<T>): Promise<T | null> {
        const b = this.bucket(type)
        const cur = b.get(id)
        if (!cur) return null
        const next = { ...cur, ...patch, id } as T
        b.set(id, next)
        return next
    }

    async delete(type: string, id: string): Promise<boolean> {
        return this.bucket(type).delete(id)
    }

    async list(type: string, opts?: { q?: string; page?: number; size?: number }): Promise<T[]> {
        const b = this.bucket(type)
        const arr = Array.from(b.values())
        const q = (opts?.q || '').toLowerCase()
        const filtered = q ? arr.filter((it) => JSON.stringify(it).toLowerCase().includes(q)) : arr
        const page = Math.max(1, opts?.page || 1)
        const size = Math.max(1, Math.min(100, opts?.size || 20))
        const start = (page - 1) * size
        return filtered.slice(start, start + size)
    }
}

export const dataRepo = new DataRepository<Item>()
