function readEnv(key: string, required = false): string {
  const val = process.env[key] || ''
  if (required && !val) {
    console.error(`[env] 缺少必需的环境变量: ${key}`)
  }
  return val
}

export const env = {
  DEEPSEEK_API_KEY: readEnv('DEEPSEEK_API_KEY'),
  DEEPSEEK_API_URL: readEnv('DEEPSEEK_API_URL'),
  APICORE_AI_KEY: readEnv('APICORE_AI_KEY'),
  NANOBANANA_API_URL: readEnv('NANOBANANA_API_URL'),
  TURSO_DATABASE_URL: readEnv('TURSO_DATABASE_URL'),
  TURSO_AUTH_TOKEN: readEnv('TURSO_AUTH_TOKEN'),
}

export function ensureServerEnv(keys: string[]) {
  const missing = keys.filter(k => !env[k as keyof typeof env])
  if (missing.length) {
    console.error('[env] 缺少环境变量:', missing.join(', '))
  }
}
