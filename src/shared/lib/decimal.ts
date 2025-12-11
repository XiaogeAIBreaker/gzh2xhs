export type Fixed = bigint

const SCALE = 100000000n

export class Decimal {
    public readonly v: Fixed
    constructor(v: Fixed) {
        this.v = v
    }
    static from(n: number) {
        return new Decimal(BigInt(Math.round(n * Number(SCALE))))
    }
    static zero() {
        return new Decimal(0n)
    }
    add(o: Decimal) {
        return new Decimal(this.v + o.v)
    }
    sub(o: Decimal) {
        return new Decimal(this.v - o.v)
    }
    mul(o: Decimal) {
        return new Decimal((this.v * o.v) / SCALE)
    }
    div(o: Decimal) {
        return new Decimal((this.v * SCALE) / o.v)
    }
    pow(k: number) {
        let r = new Decimal(SCALE)
        for (let i = 0; i < k; i++) r = r.mul(this)
        return r
    }
    neg() {
        return new Decimal(-this.v)
    }
    toNumber() {
        return Number(this.v) / Number(SCALE)
    }
    static ln(x: Decimal) {
        return new Decimal(BigInt(Math.round(Math.log(x.toNumber()) * Number(SCALE))))
    }
    static exp(x: Decimal) {
        return Decimal.from(Math.exp(x.toNumber()))
    }
    static sqrt(x: Decimal) {
        return Decimal.from(Math.sqrt(x.toNumber()))
    }
    static cdf(x: Decimal) {
        return Decimal.from(0.5 * (1 + erf(x.toNumber() / Math.SQRT2)))
    }
}

function erf(x: number) {
    const s = 1 + (a1(x) + a2(x))
    return 1 - Math.exp(-x * x) * s
}

function a1(x: number) {
    return 0.278393 * Math.abs(x)
}
function a2(x: number) {
    return 0.230389 * x * x + 0.000972 * x * x * Math.abs(x) + 0.078108 * x * x * x * x
}

export function toDecimal(n: number) {
    return Decimal.from(n)
}
export function fromDecimal(d: Decimal) {
    return d.toNumber()
}
export function roundDecimal(d: Decimal) {
    return Number(d.v) / Number(SCALE)
}
