import { Hono } from 'hono'

import { requireUserAuth, type AppVariables } from '../auth'
import { createComment, deleteComment, getCommentById, listCommentsByMemoryId } from '../comments'
import { getOtherUserId } from '../config'
import { createNotification } from '../notifications'
import { getMemoryById } from '../memories'
import { createCommentInputSchema } from '../types'

export const commentRoutes = new Hono<{ Variables: AppVariables }>()

commentRoutes.get('/memories/:memoryId/comments', (c) => {
  const memoryId = c.req.param('memoryId')
  const memory = getMemoryById(memoryId)
  if (!memory) {
    return c.json({ message: '记忆点不存在' }, 404)
  }
  return c.json({ data: listCommentsByMemoryId(memoryId) })
})

commentRoutes.post('/memories/:memoryId/comments', requireUserAuth, async (c) => {
  const memoryId = c.req.param('memoryId')
  const memory = getMemoryById(memoryId)
  if (!memory) {
    return c.json({ message: '记忆点不存在' }, 404)
  }

  const body = await c.req.json().catch(() => null)
  const parsed = createCommentInputSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ message: '请求参数不合法', errors: parsed.error.flatten() }, 400)
  }

  if (parsed.data.parentId) {
    const parent = getCommentById(parsed.data.parentId)
    if (!parent || parent.memoryId !== memoryId) {
      return c.json({ message: '父评论不存在' }, 400)
    }
  }

  const session = c.get('userSession')
  const comment = createComment(memoryId, session.userId, session.userName, parsed.data)

  const otherUserId = getOtherUserId(session.userId)
  if (parsed.data.parentId) {
    const parent = getCommentById(parsed.data.parentId)
    if (parent && parent.userId !== session.userId) {
      createNotification({
        userId: parent.userId,
        type: 'new_reply',
        title: `「${session.userName}」回复了你`,
        content: parsed.data.content.slice(0, 100),
        memoryId,
        commentId: comment.id,
        actorId: session.userId,
        actorName: session.userName,
      })
    }
  } else {
    createNotification({
      userId: otherUserId,
      type: 'new_comment',
      title: `「${session.userName}」评论了「${memory.title}」`,
      content: parsed.data.content.slice(0, 100),
      memoryId,
      commentId: comment.id,
      actorId: session.userId,
      actorName: session.userName,
    })
  }

  return c.json({ data: comment }, 201)
})

commentRoutes.delete('/comments/:id', requireUserAuth, (c) => {
  const id = c.req.param('id')
  const comment = getCommentById(id)
  if (!comment) {
    return c.json({ message: '评论不存在' }, 404)
  }

  const session = c.get('userSession')
  if (comment.userId !== session.userId) {
    return c.json({ message: '只能删除自己的评论' }, 403)
  }

  deleteComment(id)
  return c.body(null, 204)
})
