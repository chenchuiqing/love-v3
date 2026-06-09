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
    const callback = async (data: unknown) => {
      await stream.writeSSE({
        event: 'notification',
        data: JSON.stringify(data),
      })
    }

    addListener(session.userId, callback)

    try {
      while (true) {
        await stream.sleep(30000)
        await stream.writeSSE({ event: 'ping', data: '' })
      }
    } finally {
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
