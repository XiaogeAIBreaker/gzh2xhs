import { NextResponse } from 'next/server'
import { jsonError, jsonOk, ApiErrorResponse, getClientIp } from '@/lib/http'

describe('http helpers', () => {
    it('jsonError returns standardized payload', async () => {
        const res = jsonError(
            'VALIDATION_ERROR',
            '参数错误',
            400,
            { text: ['不能为空'] },
            undefined,
            'trace-1',
        )
        const body = (await (res as NextResponse).json()) as ApiErrorResponse
        expect(body.code).toBe('VALIDATION_ERROR')
        expect(body.message).toBe('参数错误')
        expect(body.fields?.text?.[0]).toBe('不能为空')
        expect(body.traceId).toBe('trace-1')
    })

    it('jsonOk returns data', async () => {
        const res = jsonOk({ a: 1 })
        const body = (await (res as NextResponse).json()) as any
        expect(body.a).toBe(1)
    })

    it('getClientIp prefers x-forwarded-for', () => {
        const req: any = {
            headers: {
                get: (k: string) => (k.toLowerCase() === 'x-forwarded-for' ? '1.2.3.4' : null),
            },
        }
        const ip = getClientIp(req)
        expect(ip).toBe('1.2.3.4')
    })

    it('getClientIp falls back to x-real-ip', () => {
        const req: any = {
            headers: { get: (k: string) => (k.toLowerCase() === 'x-real-ip' ? '5.6.7.8' : null) },
        }
        const ip = getClientIp(req)
        expect(ip).toBe('5.6.7.8')
    })
})
