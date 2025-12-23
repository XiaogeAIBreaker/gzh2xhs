import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { HealthController } from '../interfaces/http/health.controller'
import { GenerateController } from '../interfaces/http/generate.controller'
import { CacheModule } from '../shared/cache/cache.module'
import { OrmModule } from '../shared/orm/orm.module'
import { GenerateService } from './generate/generate.service'
import { DeepSeekService } from './generate/providers/deepseek.service'
import { NanoBananaService } from './generate/providers/nanobanana.service'
import { CopytextService } from './generate/lib/copytext.service'
import { AuthController } from '../interfaces/http/auth.controller'
import { AuthService } from './auth/auth.service'
import { DataController } from '../interfaces/http/data.controller'
import { DataService } from './data/data.service'
import { ExportController } from '../interfaces/http/export.controller'
import { ExportService } from './export/export.service'
import { FinanceController } from '../interfaces/http/finance.controller'
import { FinanceService } from './finance/finance.service'
import { KpiController } from '../interfaces/http/kpi.controller'
import { KpiService } from './kpi/kpi.service'
import { LogsController } from '../interfaces/http/logs.controller'
import { LogsService } from './logs/logs.service'
import { OpenapiController } from '../interfaces/http/openapi.controller'
import { OpenapiService } from './openapi/openapi.service'
import { AuthGuard } from '../shared/security/auth.guard'
import { RbacGuard } from '../shared/security/rbac.guard'
import { RateLimitGuard } from '../shared/limits/rate-limit.guard'

@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true }), CacheModule, OrmModule.forRoot()],
    controllers: [
        HealthController,
        GenerateController,
        AuthController,
        DataController,
        ExportController,
        FinanceController,
        KpiController,
        LogsController,
        OpenapiController,
    ],
    providers: [
        GenerateService,
        DeepSeekService,
        NanoBananaService,
        CopytextService,
        AuthService,
        DataService,
        ExportService,
        FinanceService,
        KpiService,
        LogsService,
        OpenapiService,
        AuthGuard,
        RbacGuard,
        RateLimitGuard,
    ],
})
export class AppModule {}
