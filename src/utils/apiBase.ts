import { featureFlags } from '../config/featureFlags'

export function getApiBaseUrl(): string {
    if (featureFlags.useNestApi) {
        const nest = process.env.NEXT_PUBLIC_API_BASE_URL
        return nest ?? 'http://localhost:4000'
    }
    return '/api'
}
