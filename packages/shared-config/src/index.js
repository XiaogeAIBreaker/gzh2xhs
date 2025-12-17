"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.loadConfig = loadConfig;
const zod_1 = require("zod");
const ConfigSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z
        .string()
        .regex(/^\d+$/)
        .transform((v) => parseInt(v, 10))
        .default("3000"),
    DATABASE_URL: zod_1.z.string().optional(),
    REDIS_URL: zod_1.z.string().optional(),
    LOG_LEVEL: zod_1.z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});
function loadConfig(env = process.env) {
    const parsed = ConfigSchema.safeParse(env);
    if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new Error(`Config validation failed: ${issues}`);
    }
    return parsed.data;
}
exports.config = loadConfig();
//# sourceMappingURL=index.js.map