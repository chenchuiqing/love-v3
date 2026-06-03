import { Hono } from 'hono'
import { z } from 'zod'

import type { AppVariables } from '../auth'
import { clearAdminSession, createAdminSession, requireAuth } from '../auth'
import { env } from '../config'

const loginBodySchema = z.object({
  password: z.string().min(1, 'password 不能为空'),
})

export const authRoutes = new Hono<{ Variables: AppVariables }>()

authRoutes.post('/login', async (c) => {
  const json = await c.req.json().catch(() => null)
  const parsed = loginBodySchema.safeParse(json)

  if (!parsed.success) {
    return c.json({ message: '请求参数不合法', errors: parsed.error.flatten() }, 400)
  }

  if (parsed.data.password !== env.ADMIN_PASSWORD) {
    return c.json({ message: '密码错误' }, 401)
  }

  await createAdminSession(c)
  return c.json({ ok: true })
})

authRoutes.post('/logout', (c) => {
  clearAdminSession(c)
  return c.json({ ok: true })
})

authRoutes.get('/me', requireAuth, (c) => {
  return c.json({ ok: true })
})
