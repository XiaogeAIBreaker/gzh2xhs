import { NextResponse } from 'next/server'

export function jsonOk<T extends Record<string, any>>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function jsonError(message: string, status = 400, details?: any) {
  return NextResponse.json({ success: false, error: message, details }, { status })
}

