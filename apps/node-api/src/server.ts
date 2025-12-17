'use strict'
import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import { createLogger } from '@gzh2xhs/shared-logger'
import { AppError } from '@gzh2xhs/shared-errors'
import { config } from '@gzh2xhs/shared-config'
import { router as generateRouter } from './routes/generate'

const app = new Koa()
const router = new Router({ prefix: '/api' })
const logger = createLogger({ level: process.env.LOG_LEVEL || 'info' })

app.use(async (ctx, next) => {
    const rid = ctx.get('x-request-id') || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    ctx.state.requestId = rid
    await next()
})

app.use(async (ctx, next) => {
    try {
        await next()
    } catch (err: any) {
        if (err instanceof AppError) {
            ctx.status = err.status
            ctx.body = err.toResponse(ctx.state.requestId)
            logger.error({ event: 'http_error', rid: ctx.state.requestId, code: err.code, message: err.message })
            return
        }
        const status = Number(err?.httpStatus || 500)
        const code = String(err?.code || 'SERVER_ERROR')
        const message = String(err?.message || '服务器错误')
        ctx.status = status
        ctx.body = { code, message, traceId: ctx.state.requestId }
        logger.error({ event: 'http_error', rid: ctx.state.requestId, code, message })
    }
})

app.use(bodyParser({ enableTypes: ['json'], jsonLimit: '1mb' }))

router.use(generateRouter.routes())
router.use(generateRouter.allowedMethods())

app.use(router.routes())
app.use(router.allowedMethods())

const port = config.PORT || 4000
app.listen(port)
