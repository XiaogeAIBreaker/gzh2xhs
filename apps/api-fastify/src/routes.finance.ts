import type { FastifyInstance } from 'fastify'
import { PricingUseCase } from '@/application/finance/PricingUseCase'
import { RiskUseCase } from '@/application/finance/RiskUseCase'
import { ReportingUseCase } from '@/application/finance/ReportingUseCase'

export function registerFinance(app: FastifyInstance) {
    app.post('/api/finance/pricing', async (req, reply) => {
        const body = req.body as any
        const container = (req as any).container
        const usecase = new PricingUseCase(container)
        const res = await usecase.execute(body)
        reply.code(200).send(res)
    })
    app.post('/api/finance/risk', async (req, reply) => {
        const body = req.body as any
        const container = (req as any).container
        const usecase = new RiskUseCase(container)
        const res = await usecase.execute(body)
        reply.code(200).send(res)
    })
    app.post('/api/finance/report', async (req, reply) => {
        const body = req.body as any
        const container = (req as any).container
        const usecase = new ReportingUseCase(container)
        const res = await usecase.execute(body)
        reply.code(200).send(res)
    })
}
