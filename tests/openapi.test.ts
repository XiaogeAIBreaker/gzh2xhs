import { describe, it, expect } from 'vitest'
import { generateOpenApiDocument } from '@/docs/openapi'

describe('OpenAPI document', () => {
    it('contains required paths and schemas', () => {
        const doc = generateOpenApiDocument(undefined)
        const paths = doc.paths || {}
        expect(paths['/api/generate']).toBeDefined()
        expect(paths['/api/export']).toBeDefined()
        expect(paths['/api/track']).toBeDefined()
        expect(paths['/api/kpi']).toBeDefined()
        expect(paths['/api/openapi']).toBeDefined()
        expect(paths['/api/finance/pricing']).toBeDefined()
        expect(paths['/api/finance/risk']).toBeDefined()
        expect(paths['/api/finance/report']).toBeDefined()
        expect(doc.components?.schemas?.ApiErrorResponse).toBeDefined()
    })
})
