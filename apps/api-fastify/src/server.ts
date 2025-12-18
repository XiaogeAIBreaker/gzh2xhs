import { buildApp } from './app.js'
import { registerRoutes } from './routes/index.js'

async function main() {
    const app = buildApp()
    registerRoutes(app)
    const port = Number(process.env.PORT || 3002)
    await app.listen({ port, host: '0.0.0.0' })
}

main()
