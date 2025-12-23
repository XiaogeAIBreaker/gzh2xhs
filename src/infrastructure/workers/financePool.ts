type Task<T> = () => Promise<T> | T

/**
 *
 */
export class FinanceWorkerPool {
    private readonly size: number
    /**
     *
     */
    constructor(size = Math.max(1, Math.min(4, Number(process.env.FIN_WORKERS) || 2))) {
        this.size = size
    }
    /**
     *
     */
    async runBatch<T>(tasks: Task<T>[]) {
        const out: T[] = []
        for (const t of tasks) out.push(await t())

        return out
    }
}
