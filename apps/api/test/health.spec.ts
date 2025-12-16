import request from 'supertest'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../src/modules/app.module'

describe('Health', () => {
    it('returns ok true', async () => {
        const app = await NestFactory.create(AppModule)
        const server = app.getHttpServer()
        await app.init()
        const res = await request(server).get('/health')
        expect(res.status).toBe(200)
        expect(res.body.ok).toBe(true)
        await app.close()
    })
})
