import { buildApp } from './app.js'
import { registerRoutes } from './routes/index.js'
import { logger as webLogger } from '@/lib/logger'

async function main() {
    const app = buildApp()
    registerRoutes(app)
    const port = Number(process.env.PORT || 3002)
    await app.listen({ port, host: '0.0.0.0' })
}

process.on('unhandledRejection', (reason: any) => {
    webLogger.error({ event: 'unhandled_rejection', reason })
})

process.on('uncaughtException', (err) => {
    webLogger.error({ event: 'uncaught_exception', error: String(err?.message || err) })
})

main().catch((err) => {
    webLogger.error({ event: 'server_start_failed', error: String(err?.message || err) })
    process.exit(1)
})
