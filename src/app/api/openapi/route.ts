import { NextResponse } from 'next/server'
import { generateOpenApiDocument } from '@/docs/openapi'

export const runtime = 'nodejs'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || undefined
  const doc = generateOpenApiDocument(baseUrl)
  return NextResponse.json(doc, { status: 200 })
}
