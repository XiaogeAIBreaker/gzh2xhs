import { NextRequest } from 'next/server'
export const runtime = 'nodejs'
import { GenerateController } from '@/interfaces/http/controllers/GenerateController'

export async function POST(req: NextRequest) {
  const controller = new GenerateController()
  return controller.post(req)
}
