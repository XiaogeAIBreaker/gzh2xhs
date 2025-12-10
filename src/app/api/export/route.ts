import { NextRequest } from 'next/server'
export const runtime = 'nodejs'
import { ExportController } from '@/interfaces/http/controllers/ExportController'

export async function POST(req: NextRequest) {
  const controller = new ExportController()
  return controller.post(req)
}
