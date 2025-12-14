import { Module } from '@nestjs/common'
import { HealthController } from '../interfaces/http/health.controller'
import { GenerateController } from '../interfaces/http/generate.controller'
import { CacheModule } from '../shared/cache/cache.module'
import { OrmModule } from '../shared/orm/orm.module'
import { GenerateService } from './generate/generate.service'

@Module({
    imports: [CacheModule, OrmModule.forRoot()],
    controllers: [HealthController, GenerateController],
    providers: [GenerateService],
})
export class AppModule {}
