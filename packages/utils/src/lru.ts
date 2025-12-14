export class LRUCache<K, V> {
    private map = new Map<K, V>()
    private order: K[] = []
    private readonly maxSize: number
    constructor(maxSize: number = 128) {
        this.maxSize = Math.max(1, Math.floor(maxSize))
    }
    get(key: K): V | undefined {
        const v = this.map.get(key)
        if (v !== undefined) this.touch(key)
        return v
    }
    set(key: K, value: V): void {
        if (this.map.has(key)) {
            this.map.set(key, value)
            this.touch(key)
            return
        }
        this.map.set(key, value)
        this.order.push(key)
        this.evict()
    }
    has(key: K): boolean {
        return this.map.has(key)
    }
    delete(key: K): void {
        if (!this.map.has(key)) return
        this.map.delete(key)
        this.order = this.order.filter((k) => k !== key)
    }
    clear(): void {
        this.map.clear()
        this.order = []
    }
    private touch(key: K): void {
        this.order = this.order.filter((k) => k !== key)
        this.order.push(key)
    }
    private evict(): void {
        while (this.order.length > this.maxSize) {
            const oldest = this.order.shift()
            if (oldest !== undefined) this.map.delete(oldest)
        }
    }
}
