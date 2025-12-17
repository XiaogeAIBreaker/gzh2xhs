import { z, ZodSchema } from "zod";

export class ValidationError extends Error {
  code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateZod<T>(schema: ZodSchema<T>, data: unknown): T {
  const res = schema.safeParse(data);
  if (!res.success) {
    const msg = res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new ValidationError(msg);
  }
  return res.data;
}

export const idempotencyKeySchema = z.string().min(8).max(128).optional();
