import { db } from './db'
import { generateSnowflakeId } from './snowflake'
import { notifyUser } from './sse'
import type { NotificationDto, NotificationRow, NotificationType } from './types'

const rowToDto = (row: NotificationRow): NotificationDto => ({
  id: row.id,
  userId: row.user_id,
  type: row.type as NotificationType,
  title: row.title,
  content: row.content,
  memoryId: row.memory_id,
  commentId: row.comment_id,
  actorId: row.actor_id,
  actorName: row.actor_name,
  isRead: row.is_read === 1,
  createdAt: row.created_at,
})

const listByUserStmt = db.query<NotificationRow, [string]>(
  `SELECT id, user_id, type, title, content, memory_id, comment_id, actor_id, actor_name, is_read, created_at
   FROM notifications
   WHERE user_id = ?1
   ORDER BY datetime(created_at) DESC
   LIMIT 50`,
)

const unreadCountStmt = db.query<{ count: number }, [string]>(
  'SELECT COUNT(1) as count FROM notifications WHERE user_id = ?1 AND is_read = 0',
)

const insertStmt = db.prepare(
  `INSERT INTO notifications (id, user_id, type, title, content, memory_id, comment_id, actor_id, actor_name)
   VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
)

const markReadStmt = db.prepare(
  'UPDATE notifications SET is_read = 1 WHERE id = ?1 AND user_id = ?2',
)

const markAllReadStmt = db.prepare(
  'UPDATE notifications SET is_read = 1 WHERE user_id = ?1 AND is_read = 0',
)

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  content: string
  memoryId: string
  commentId?: string
  actorId: string
  actorName: string
}

export const createNotification = (params: CreateNotificationParams): NotificationDto => {
  const id = generateSnowflakeId()

  insertStmt.run(
    id,
    params.userId,
    params.type,
    params.title,
    params.content,
    params.memoryId,
    params.commentId ?? null,
    params.actorId,
    params.actorName,
  )

  const row = db.query<NotificationRow, [string]>(
    `SELECT id, user_id, type, title, content, memory_id, comment_id, actor_id, actor_name, is_read, created_at
     FROM notifications WHERE id = ?1`,
  ).get(id)!

  const dto = rowToDto(row)

  notifyUser(params.userId, {
    type: 'notification',
    notification: dto,
  })

  return dto
}

export const listNotificationsByUserId = (userId: string): NotificationDto[] => {
  return listByUserStmt.all(userId).map(rowToDto)
}

export const getUnreadCount = (userId: string): number => {
  return unreadCountStmt.get(userId)?.count ?? 0
}

export const markNotificationRead = (id: string, userId: string): boolean => {
  const result = markReadStmt.run(id, userId)
  return (result.changes ?? 0) > 0
}

export const markAllNotificationsRead = (userId: string): number => {
  const result = markAllReadStmt.run(userId)
  return result.changes ?? 0
}
