import { Equity, Bond, DerivativeOption } from '@/domain/finance/instruments'
import {
    varGaussian,
    equityExposure,
    bondDurationApprox,
    optionGreeksApprox,
} from '@/domain/finance/risk'
import { audit } from '@/shared/lib/audit'
import { FinanceWorkerPool } from '@/infrastructure/workers/financePool'

export class RiskUseCase {
    async varGaussian(returns: number[], alpha = 0.95, traceId?: string) {
        const val = varGaussian(returns, alpha)
        audit(
            'risk_var_gaussian',
            { n: returns.length, alpha },
            { var: val },
            traceId ? { traceId } : undefined,
        )
        return { var: val }
    }
    async equityExposure(eq: Equity, position: number, price: number, traceId?: string) {
        const res = equityExposure(eq, position, price)
        audit(
            'risk_equity_exposure',
            { eq, position, price },
            res,
            traceId ? { traceId } : undefined,
        )
        return res
    }
    async bondDurationApprox(bond: Bond, y: number, traceId?: string) {
        const d = bondDurationApprox(bond, y)
        audit('risk_bond_duration', { bond, y }, { duration: d }, traceId ? { traceId } : undefined)
        return { duration: d, currency: bond.currency }
    }
    async optionGreeksApprox(
        opt: DerivativeOption,
        spot: number,
        r: number,
        sigma: number,
        tYears: number,
        traceId?: string,
    ) {
        const g = optionGreeksApprox(opt, spot, r, sigma, tYears)
        audit(
            'risk_option_greeks',
            { opt, spot, r, sigma, tYears },
            g,
            traceId ? { traceId } : undefined,
        )
        return g
    }

    async batchVarGaussian(samples: number[][], alpha = 0.95, traceId?: string) {
        const pool = new FinanceWorkerPool()
        const tasks = samples.map((arr) => () => varGaussian(arr, alpha))
        const out = await pool.runBatch(tasks)
        audit(
            'risk_var_batch',
            { batches: samples.length, alpha },
            { results: out },
            traceId ? { traceId } : undefined,
        )
        return out
    }
}
