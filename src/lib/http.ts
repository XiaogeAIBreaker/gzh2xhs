import { NextResponse } from 'next/server'

export function jsonOk<T extends Record<string, any>>(
  data: T,
  status = 200,
  headers?: Record<string, string>
) {
  return NextResponse.json(data, { status, headers })
}

export function jsonError(
  message: string,
  status = 400,
  details?: any,
  headers?: Record<string, string>
) {
  return NextResponse.json({ success: false, error: message, details }, { status, headers })
}
