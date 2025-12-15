'use strict'
import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import pino from 'pino'
import { router as generateRouter } from './routes/generate'

const app = new Koa()
const router = new Router({ prefix: '/api' })
const logger = pino()

app.use(async (ctx, next) => {
    const rid = ctx.get('x-request-id') || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    ctx.state.requestId = rid
    await next()
})

app.use(async (ctx, next) => {
    try {
        await next()
    } catch (err: any) {
        const status = Number(err?.httpStatus || 500)
        const code = String(err?.code || 'SERVER_ERROR')
        const message = String(err?.message || '服务器错误')
        ctx.status = status
        ctx.body = { code, message, traceId: ctx.state.requestId }
        logger.error({ err, scope: 'server', rid: ctx.state.requestId })
    }
})

app.use(bodyParser({ enableTypes: ['json'], jsonLimit: '1mb' }))

router.use(generateRouter.routes())
router.use(generateRouter.allowedMethods())

app.use(router.routes())
app.use(router.allowedMethods())

const port = Number(process.env.PORT || 4000)
app.listen(port)
