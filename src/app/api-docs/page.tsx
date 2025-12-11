'use client'
import NextDynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'
import { generateOpenApiDocument } from '@/docs/openapi'

export const dynamic = 'force-dynamic'

const SwaggerUI = NextDynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDocsPage() {
    const spec = generateOpenApiDocument(process.env.NEXT_PUBLIC_BASE_URL)
    const SwaggerUIAny = SwaggerUI as any
    return (
        <main className="p-4">
            <SwaggerUIAny spec={spec} docExpansion="list" defaultModelsExpandDepth={1} />
        </main>
    )
}
