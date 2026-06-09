import { Hono } from 'hono'
import { z } from 'zod'

import { clearUserSession, createUserSession, requireUserAuth, type AppVariables } from '../auth'
import { findUserByCredentials, findUserById, userAccounts } from '../config'

const loginBodySchema = z.object({
  name: z.string().min(1, 'name 不能为空'),
  password: z.string().min(1, 'password 不能为空'),
})

export const userAuthRoutes = new Hono<{ Variables: AppVariables }>()

userAuthRoutes.get('/options', (c) => {
  return c.json({
    data: userAccounts.map((u) => ({ id: u.id, name: u.name })),
  })
})

userAuthRoutes.post('/login', async (c) => {
  const json = await c.req.json().catch(() => null)
  const parsed = loginBodySchema.safeParse(json)

  if (!parsed.success) {
    return c.json({ message: '请求参数不合法', errors: parsed.error.flatten() }, 400)
  }

  const user = findUserByCredentials(parsed.data.name, parsed.data.password)
  if (!user) {
    return c.json({ message: '用户名或密码错误' }, 401)
  }

  await createUserSession(c, user.id, user.name)
  return c.json({ data: { id: user.id, name: user.name } })
})

userAuthRoutes.post('/logout', (c) => {
  clearUserSession(c)
  return c.json({ ok: true })
})

userAuthRoutes.get('/me', requireUserAuth, (c) => {
  const session = c.get('userSession')
  return c.json({ data: { id: session.userId, name: session.userName } })
})
