import { buildOpenApiDocument } from './builder'

/**
 *
 */
export function generateOpenApiDocument(baseUrl: string | undefined) {
    return buildOpenApiDocument(baseUrl)
}
