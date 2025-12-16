import request from 'supertest'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../src/modules/app.module'

describe('Generate', () => {
    it('requires access for card_generate', async () => {
        const app = await NestFactory.create(AppModule)
        const server = app.getHttpServer()
        await app.init()

        const unauth = await request(server).post('/generate').send({ title: 't', content: 'c' })
        expect([401, 403]).toContain(unauth.status)

        const ok = await request(server)
            .post('/generate')
            .set('authorization', 'Bearer admin-token')
            .send({ title: 't', content: 'c' })
        expect(ok.status).toBe(201)
        await app.close()
    })
})
