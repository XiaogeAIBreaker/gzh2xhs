import { Module, Global } from '@nestjs/common'
import { CacheProvider } from './cache.provider'
import { MemoryCache } from './memory.cache'
import { RedisCache } from './redis.cache'

@Global()
@Module({
    providers: [
        {
            provide: 'CACHE',
            useFactory: (): CacheProvider => {
                const url = process.env.REDIS_URL
                return url ? new RedisCache(url) : new MemoryCache()
            },
        },
    ],
    exports: ['CACHE'],
})
export class CacheModule {}
