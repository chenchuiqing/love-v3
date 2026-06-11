import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'

import { requireUserAuth, type AppVariables } from '../auth'
import { addListener, removeListener } from '../sse'
import {
  getUnreadCount,
  listNotificationsByUserId,
  markAllNotificationsRead,
  markNotificationRead,
} from '../notifications'

export const notificationRoutes = new Hono<{ Variables: AppVariables }>()

notificationRoutes.get('/notifications/stream', requireUserAuth, async (c) => {
  const session = c.get('userSession')

  return streamSSE(c, async (stream) => {
    let closed = false

    const callback = async (data: unknown) => {
      if (closed) return
      try {
        await stream.writeSSE({
          event: 'notification',
          data: JSON.stringify(data),
        })
      } catch {
        closed = true
      }
    }

    addListener(session.userId, callback)

    try {
      await stream.writeSSE({ event: 'connected', data: '' })

      while (!closed) {
        await stream.sleep(15000)
        try {
          await stream.writeSSE({ event: 'ping', data: '' })
        } catch {
          break
        }
      }
    } finally {
      closed = true
      removeListener(session.userId, callback)
    }
  })
})

notificationRoutes.get('/notifications', requireUserAuth, (c) => {
  const session = c.get('userSession')
  return c.json({ data: listNotificationsByUserId(session.userId) })
})

notificationRoutes.get('/notifications/unread-count', requireUserAuth, (c) => {
  const session = c.get('userSession')
  return c.json({ data: { count: getUnreadCount(session.userId) } })
})

notificationRoutes.put('/notifications/read-all', requireUserAuth, (c) => {
  const session = c.get('userSession')
  const count = markAllNotificationsRead(session.userId)
  return c.json({ data: { updated: count } })
})

notificationRoutes.put('/notifications/:id/read', requireUserAuth, (c) => {
  const session = c.get('userSession')
  const id = c.req.param('id')
  const ok = markNotificationRead(id, session.userId)
  if (!ok) {
    return c.json({ message: '通知不存在' }, 404)
  }
  return c.json({ data: { ok: true } })
})
