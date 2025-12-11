import { createRateLimiter } from '@/lib/rateLimiter'
import { appConfig } from '@/config'

export class RateLimiterRepository {
    private limiter = createRateLimiter(appConfig.features.rateLimit)
    async allow(key: string): Promise<boolean> {
        return this.limiter.allow(key)
    }
}
