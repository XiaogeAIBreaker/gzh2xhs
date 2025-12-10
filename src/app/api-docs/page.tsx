'use client'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import { generateOpenApiDocument } from '@/docs/openapi'

export default function ApiDocsPage() {
  const spec = generateOpenApiDocument(process.env.NEXT_PUBLIC_BASE_URL)
  return (
    <main className="p-4">
      <SwaggerUI spec={spec as any} docExpansion="list" defaultModelsExpandDepth={1} />
    </main>
  )
}
