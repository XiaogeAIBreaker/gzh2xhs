export type CurrencyCode = 'USD' | 'EUR' | 'CNY' | 'JPY' | 'GBP'

export type Equity = {
    kind: 'equity'
    symbol: string
    currency: CurrencyCode
}

export type BondDayCount = '30/360' | 'ACT/360' | 'ACT/365' | 'ACT/ACT'

export type Bond = {
    kind: 'bond'
    isin?: string
    currency: CurrencyCode
    faceValue: number
    couponRate: number
    couponFreqPerYear: number
    maturityDate: string
    dayCount: BondDayCount
}

export type OptionType = 'call' | 'put'

export type DerivativeOption = {
    kind: 'option'
    underlyingSymbol: string
    type: OptionType
    strike: number
    maturityDate: string
    currency: CurrencyCode
}

export type Instrument = Equity | Bond | DerivativeOption

export type PricingResult = {
    price: number
    currency: CurrencyCode
}
