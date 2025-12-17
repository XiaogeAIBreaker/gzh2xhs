import { z } from "zod";
declare const ConfigSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    PORT: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    DATABASE_URL: z.ZodOptional<z.ZodString>;
    REDIS_URL: z.ZodOptional<z.ZodString>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["fatal", "error", "warn", "info", "debug", "trace", "silent"]>>;
}, "strip", z.ZodTypeAny, {
    LOG_LEVEL: "debug" | "trace" | "info" | "warn" | "error" | "fatal" | "silent";
    NODE_ENV: "development" | "test" | "production";
    PORT: number;
    REDIS_URL?: string | undefined;
    DATABASE_URL?: string | undefined;
}, {
    REDIS_URL?: string | undefined;
    DATABASE_URL?: string | undefined;
    LOG_LEVEL?: "debug" | "trace" | "info" | "warn" | "error" | "fatal" | "silent" | undefined;
    NODE_ENV?: "development" | "test" | "production" | undefined;
    PORT?: string | undefined;
}>;
export type AppConfig = z.infer<typeof ConfigSchema>;
export declare function loadConfig(env?: NodeJS.ProcessEnv): AppConfig;
export declare const config: AppConfig;
export {};
