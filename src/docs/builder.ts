import { ApiErrorResponse } from './schemas/common'
import { paths } from './routes'

/**
 *
 */
export function buildOpenApiDocument(baseUrl?: string) {
    const servers = baseUrl ? [{ url: baseUrl }] : [{ url: 'http://localhost:3000' }]
    return {
        openapi: '3.0.0',
        info: { title: 'gzh2xhs API', version: '1.0.0' },
        servers,
        components: { schemas: { ApiErrorResponse } },
        paths,
    }
}
