import { Hono } from 'hono'

import { requireAuth, type AppVariables } from '../auth'
import { createMemory, deleteMemory, getMemoryById, listMemories, updateMemory } from '../memories'
import { createMemoryInputSchema, updateMemoryInputSchema } from '../types'

export const memoryRoutes = new Hono<{ Variables: AppVariables }>()

memoryRoutes.get('/memories', (c) => {
  return c.json({ data: listMemories() })
})

memoryRoutes.get('/admin/memories', requireAuth, (c) => {
  return c.json({ data: listMemories() })
})

memoryRoutes.get('/admin/memories/:id', requireAuth, (c) => {
  const id = c.req.param('id')
  const memory = getMemoryById(id)
  if (!memory) {
    return c.json({ message: '记忆点不存在' }, 404)
  }
  return c.json({ data: memory })
})

memoryRoutes.post('/admin/memories', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = createMemoryInputSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ message: '请求参数不合法', errors: parsed.error.flatten() }, 400)
  }

  try {
    const memory = createMemory(parsed.data)
    return c.json({ data: memory }, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'ID 已存在') {
      return c.json({ message: error.message }, 409)
    }
    return c.json({ message: '创建失败' }, 500)
  }
})

memoryRoutes.put('/admin/memories/:id', requireAuth, async (c) => {
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

memoryRoutes.delete('/admin/memories/:id', requireAuth, (c) => {
  const id = c.req.param('id')
  const removed = deleteMemory(id)

  if (!removed) {
    return c.json({ message: '记忆点不存在' }, 404)
  }

  return c.body(null, 204)
})
