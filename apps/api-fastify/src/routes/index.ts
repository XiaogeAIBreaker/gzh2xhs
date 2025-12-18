import type { FastifyInstance } from 'fastify'
import { registerGenerate } from './routes.generate'
import { registerExport } from './routes.export'
import { registerFinance } from './routes.finance'
import { registerAuth } from './routes.auth'
import { registerData } from './routes.data'
import { registerLogs } from './routes.logs'
import { registerKpi } from './routes.kpi'
import { registerOpenapi } from './routes.openapi'
import { registerHealth } from './routes.health'

export function registerRoutes(app: FastifyInstance) {
    registerHealth(app)
    registerOpenapi(app)
    registerAuth(app)
    registerData(app)
    registerLogs(app)
    registerKpi(app)
    registerFinance(app)
    registerGenerate(app)
    registerExport(app)
}
