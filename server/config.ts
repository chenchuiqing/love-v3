import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  ADMIN_PASSWORD: z.string().min(1, 'ADMIN_PASSWORD 不能为空'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET 至少需要 32 个字符'),
  DATA_DIR: z.string().default('data'),
  UPLOAD_DIR: z.string().default('uploads/memories'),
  SESSION_COOKIE_NAME: z.string().default('love_admin_session'),
  SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  const errors = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`环境变量校验失败:\n${errors}`)
}

export const env = parsedEnv.data

export const isProduction = env.NODE_ENV === 'production'
