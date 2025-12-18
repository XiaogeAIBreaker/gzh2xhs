import { z } from "zod";

/**
 * 环境配置 Schema，确保必需的环境变量齐全且合法。
 */
const ConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z
    .string()
    .regex(/^\d+$/)
    .transform((v) => parseInt(v, 10))
    .default("3000"),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

/** 应用配置类型 */
export type AppConfig = z.infer<typeof ConfigSchema>;

/**
 * 解析并校验环境变量，返回类型安全的配置对象。
 * @param env 进程环境变量（默认 `process.env`）
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`Config validation failed: ${issues}`);
  }
  return parsed.data;
}

/** 立即加载的全局配置对象 */
export const config: AppConfig = loadConfig();
