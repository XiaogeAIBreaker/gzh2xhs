import { logger } from '@/lib/logger'
import { CacheRepository } from '@/infrastructure/repositories/CacheRepository'
import { RateLimiterRepository } from '@/infrastructure/repositories/RateLimiterRepository'
import { AIProvider } from '@/infrastructure/providers/AIProvider'
import { appConfig } from '@/config'

export type RequestContext = { requestId?: string | undefined; ip?: string | undefined }

export class AppContainer {
    readonly logger = logger
    readonly cacheRepo = new CacheRepository()
    readonly rateLimiterRepo = new RateLimiterRepository()
    readonly aiProvider = new AIProvider()
    readonly config = appConfig
    readonly ctx: RequestContext
    constructor(ctx?: RequestContext) {
        this.ctx = ctx || {}
    }
}

export function createRequestContainer(ctx?: RequestContext) {
    return new AppContainer(ctx)
}
