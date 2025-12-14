import { describe, it, expect } from 'vitest'
import { Limiter } from '@/shared/lib/concurrency'

function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
}

describe('Limiter', () => {
    it('limits concurrent tasks', async () => {
        const limiter = new Limiter(2)
        let running = 0
        let maxRunning = 0
        const task = async () => {
            running += 1
            maxRunning = Math.max(maxRunning, running)
            await delay(50)
            running -= 1
            return true
        }

        await Promise.all([
            limiter.run(task),
            limiter.run(task),
            limiter.run(task),
            limiter.run(task),
        ])
        expect(maxRunning).toBeLessThanOrEqual(2)
    })
})
