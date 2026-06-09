import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET 至少需要 32 个字符'),
  DATA_DIR: z.string().default('data'),
  UPLOAD_DIR: z.string().default('uploads/memories'),
  USER_SESSION_COOKIE_NAME: z.string().default('love_user_session'),
  SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),
  PARTY_A_NAME: z.string().min(1, 'PARTY_A_NAME 不能为空'),
  PARTY_A_PASSWORD: z.string().min(1, 'PARTY_A_PASSWORD 不能为空'),
  PARTY_B_NAME: z.string().min(1, 'PARTY_B_NAME 不能为空'),
  PARTY_B_PASSWORD: z.string().min(1, 'PARTY_B_PASSWORD 不能为空'),
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

export interface UserAccount {
  id: string
  name: string
  password: string
}

export const userAccounts: UserAccount[] = [
  { id: 'party_a', name: env.PARTY_A_NAME, password: env.PARTY_A_PASSWORD },
  { id: 'party_b', name: env.PARTY_B_NAME, password: env.PARTY_B_PASSWORD },
]

export const findUserByCredentials = (name: string, password: string): UserAccount | null => {
  return userAccounts.find((u) => u.name === name && u.password === password) ?? null
}

export const findUserById = (id: string): UserAccount | null => {
  return userAccounts.find((u) => u.id === id) ?? null
}

export const getOtherUserId = (userId: string): string => {
  return userId === 'party_a' ? 'party_b' : 'party_a'
}
