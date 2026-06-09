import { serveStatic } from 'hono/bun'
import { Hono } from 'hono'
import { mkdirSync } from 'node:fs'

import type { AppVariables } from './auth'
import { requireUserAuth } from './auth'
import { env } from './config'
import './db'
import { userAuthRoutes } from './routes/auth'
import { commentRoutes } from './routes/comments'
import { memoryRoutes } from './routes/memories'
import { notificationRoutes } from './routes/notifications'
import { uploadRoutes } from './routes/upload'

const app = new Hono<{ Variables: AppVariables }>()

mkdirSync(env.UPLOAD_DIR, { recursive: true })

app.use(
  '/uploads/*',
  serveStatic({
    root: './uploads',
    rewriteRequestPath: (path) => path.replace(/^\/uploads/, ''),
  }),
)

app.get('/api/health', (c) => {
  return c.json({ ok: true, env: env.NODE_ENV })
})

app.route('/api/auth/user', userAuthRoutes)
app.route('/api', memoryRoutes)
app.route('/api', commentRoutes)
app.route('/api', notificationRoutes)
app.route('/api', uploadRoutes)

app.get('/api/publish/health', requireUserAuth, (c) => {
  return c.json({ ok: true })
})

app.all('/api/*', (c) => {
  return c.json({ message: '接口不存在' }, 404)
})

app.use('/*', serveStatic({ root: './dist' }))
app.get('*', serveStatic({ root: './dist', path: 'index.html' }))

const server = Bun.serve({
  port: env.PORT,
  hostname: '0.0.0.0',
  fetch: app.fetch,
})

console.log(`Server is running at http://localhost:${server.port}`)
console.log(`LAN access: http://0.0.0.0:${server.port}`)
