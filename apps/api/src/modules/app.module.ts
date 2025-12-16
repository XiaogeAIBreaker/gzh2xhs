import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { HealthController } from '../interfaces/http/health.controller'
import { GenerateController } from '../interfaces/http/generate.controller'
import { CacheModule } from '../shared/cache/cache.module'
import { OrmModule } from '../shared/orm/orm.module'
import { GenerateService } from './generate/generate.service'
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
        AuthService,
        DataService,
        ExportService,
        FinanceService,
        KpiService,
        LogsService,
        OpenapiService,
    ],
})
export class AppModule {}
