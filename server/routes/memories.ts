import { Hono } from 'hono'

import { requireUserAuth, type AppVariables } from '../auth'
import { getOtherUserId } from '../config'
import { createMemory, deleteMemory, getMemoryById, listMemories, updateMemory } from '../memories'
import { createNotification } from '../notifications'
import { createMemoryInputSchema, updateMemoryInputSchema } from '../types'

export const memoryRoutes = new Hono<{ Variables: AppVariables }>()

memoryRoutes.get('/memories', (c) => {
  return c.json({ data: listMemories() })
})

memoryRoutes.get('/publish/memories', requireUserAuth, (c) => {
  return c.json({ data: listMemories() })
})

memoryRoutes.get('/publish/memories/:id', requireUserAuth, (c) => {
  const id = c.req.param('id')
  const memory = getMemoryById(id)
  if (!memory) {
    return c.json({ message: '记忆点不存在' }, 404)
  }
  return c.json({ data: memory })
})

memoryRoutes.post('/publish/memories', requireUserAuth, async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = createMemoryInputSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ message: '请求参数不合法', errors: parsed.error.flatten() }, 400)
  }

  try {
    const memory = createMemory(parsed.data)

    const session = c.get('userSession')
    const otherUserId = getOtherUserId(session.userId)
    createNotification({
      userId: otherUserId,
      type: 'new_memory',
      title: `「${session.userName}」发布了新记忆「${memory.title}」`,
      content: memory.content.text?.slice(0, 100) ?? '',
      memoryId: memory.id,
      actorId: session.userId,
      actorName: session.userName,
    })

    return c.json({ data: memory }, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'ID 已存在') {
      return c.json({ message: error.message }, 409)
    }
    return c.json({ message: '创建失败' }, 500)
  }
})

memoryRoutes.put('/publish/memories/:id', requireUserAuth, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const parsed = updateMemoryInputSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ message: '请求参数不合法', errors: parsed.error.flatten() }, 400)
  }

  if (!getMemoryById(id)) {
    return c.json({ message: '记忆点不存在' }, 404)
  }

  const updated = updateMemory(id, parsed.data)
  return c.json({ data: updated })
})

memoryRoutes.delete('/publish/memories/:id', requireUserAuth, (c) => {
  const id = c.req.param('id')
  const removed = deleteMemory(id)

  if (!removed) {
    return c.json({ message: '记忆点不存在' }, 404)
  }

  return c.body(null, 204)
})
