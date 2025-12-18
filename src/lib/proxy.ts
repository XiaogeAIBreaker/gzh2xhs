import { NextRequest, NextResponse } from 'next/server'

function baseUrl() {
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
}

export async function proxy(req: NextRequest, path: string, method: string) {
    const url = `${baseUrl()}${path}`
    const init: RequestInit = {
        method,
        headers: {
            'content-type': req.headers.get('content-type') || 'application/json',
            authorization: req.headers.get('authorization') || '',
            'x-request-id': req.headers.get('x-request-id') || '',
        },
        body:
            method === 'GET'
                ? undefined
                : (await (async () => {
                      const r: any = req as any
                      if (typeof r.text === 'function') return await r.text()
                      if (typeof r.json === 'function') return JSON.stringify(await r.json())
                      if (r.body) return typeof r.body === 'string' ? r.body : JSON.stringify(r.body)
                      return undefined
                  })()),
    }
    const res = await fetch(url, init)
    const headers: Record<string, string> = {}
    res.headers.forEach((v, k) => {
        headers[k] = v
    })
    if (res.headers.get('content-type')?.includes('application/zip')) {
        const buf = await res.arrayBuffer()
        return new NextResponse(Buffer.from(buf), { status: res.status, headers })
    }
    const json = await res.json().catch(() => null)
    return NextResponse.json(json, { status: res.status, headers })
}
