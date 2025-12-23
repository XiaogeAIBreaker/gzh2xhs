import { appConfig } from '@/config'

/**
 *
 */
export class Limiter {
    private running = 0
    private queue: Array<() => void> = []
    private readonly limit: number

    /**
     *
     */
    constructor(limit: number) {
        this.limit = Math.max(1, limit)
    }

    /**
     *
     */
    async run<T>(task: () => Promise<T>): Promise<T> {
        if (this.running >= this.limit) {
            await new Promise<void>((resolve) => this.queue.push(resolve))
        }
        this.running += 1
        try {
            const result = await task()
            return result
        } finally {
            this.running -= 1
            const next = this.queue.shift()
            if (next) next()
        }
    }
}

/**
 * 全局并发限制器（容错读取配置）。
 */
export const globalLimiter = new Limiter(appConfig.features?.concurrency?.serverLimit ?? 8)
