import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  MAGIC_TOKEN_EXPIRES_IN: z.string().default('15m'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3100'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  BOT_TOKEN: z.string(),
  BOT_WEBHOOK_SECRET: z.string().default(''),
  BOT_USERNAME: z.string().default(''),
  BODY_PARSER_LIMIT: z.string().default('20mb'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(10485760),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Environment validation failed: ${result.error.message}`);
  }
  return result.data;
}
