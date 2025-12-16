import { z } from 'zod'

const EnvSchema = z.object({
    NODE_ENV: z.string().default('development'),
    DEEPSEEK_API_KEY: z.string().optional().default(''),
    DEEPSEEK_API_URL: z.string().url().default('https://api.deepseek.com/chat/completions'),
    APICORE_AI_KEY: z.string().optional().default(''),
    NANOBANANA_API_URL: z.string().url().default('https://kg-api.cloud/v1/chat/completions'),
    REDIS_URL: z.string().optional().default(''),
    REDIS_CLUSTER_URLS: z.string().optional().default(''),
    OIDC_ISSUER: z.string().optional().default(''),
    OIDC_AUDIENCE: z.string().optional().default(''),
    OIDC_USERINFO_URL: z.string().optional().default(''),
})

const parsed = EnvSchema.safeParse(process.env)
if (!parsed.success) {
    throw new Error(`环境变量无效: ${parsed.error.flatten().formErrors.join(', ')}`)
}

const env = parsed.data

export const appConfig = {
    env: env.NODE_ENV,
    runtime: {
        redisUrl: env.REDIS_URL,
        redisClusterUrls: env.REDIS_CLUSTER_URLS,
    },
    ai: {
        defaults: {
            temperature: 0.7,
            maxTokens: 4000,
        },
        deepseek: {
            apiKey: env.DEEPSEEK_API_KEY,
            apiUrl: env.DEEPSEEK_API_URL,
            model: 'deepseek-chat',
            enabled: !!env.DEEPSEEK_API_KEY,
        },
        nanobanana: {
            apiKey: env.APICORE_AI_KEY,
            apiUrl: env.NANOBANANA_API_URL,
            model: 'gpt-5-chat-latest',
            enabled: !!env.APICORE_AI_KEY,
        },
    },
    auth: {
        oidc: {
            issuer: env.OIDC_ISSUER,
            audience: env.OIDC_AUDIENCE,
            userinfoUrl: env.OIDC_USERINFO_URL,
        },
    },
    features: {
        rateLimit: {
            windowMs: 60_000,
            max: 60,
        },
        caching: {
            enableETag: true,
            defaultTtlMs: 60_000,
            readTtlMs: 600_000,
        },
        concurrency: {
            serverLimit: 8,
        },
    },
}
