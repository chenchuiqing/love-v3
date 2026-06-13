import { db } from './db'
import { generateSnowflakeId } from './snowflake'
import type { CommentDto, CommentRow, CreateCommentInput } from './types'

const rowToDto = (row: CommentRow): CommentDto => ({
  id: row.id,
  memoryId: row.memory_id,
  parentId: row.parent_id,
  userId: row.user_id,
  userName: row.user_name,
  content: row.content,
  createdAt: row.created_at,
  replies: [],
})

export const listCommentsByMemoryId = (memoryId: string): CommentDto[] => {
  const rows = db.query<CommentRow, [string]>(
    `SELECT id, memory_id, parent_id, user_id, user_name, content, created_at
     FROM comments
     WHERE memory_id = ?1
     ORDER BY datetime(created_at) ASC`,
  ).all(memoryId)

  const all = rows.map(rowToDto)
  const byParent = new Map<string, CommentDto[]>()
  for (const c of all) {
    if (c.parentId) {
      if (!byParent.has(c.parentId)) byParent.set(c.parentId, [])
      byParent.get(c.parentId)!.push(c)
    }
  }

  const populate = (parent: CommentDto): void => {
    const children = byParent.get(parent.id) ?? []
    parent.replies = children.map((child) => {
      populate(child)
      return child
    })
  }

  const topLevel = all.filter((c) => c.parentId === null)
  for (const p of topLevel) populate(p)

  return topLevel
}

const insertStmt = db.prepare(
  `INSERT INTO comments (id, memory_id, parent_id, user_id, user_name, content)
   VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
)

const getByIdStmt = db.query<CommentRow, [string]>(
  `SELECT id, memory_id, parent_id, user_id, user_name, content, created_at
   FROM comments WHERE id = ?1`,
)

const deleteStmt = db.prepare('DELETE FROM comments WHERE id = ?1')

const countByMemoryStmt = db.query<{ count: number }, [string]>(
  'SELECT COUNT(1) as count FROM comments WHERE memory_id = ?1',
)

export const createComment = (
  memoryId: string,
  userId: string,
  userName: string,
  input: CreateCommentInput,
): CommentDto => {
  const id = generateSnowflakeId()

  insertStmt.run(id, memoryId, input.parentId ?? null, userId, userName, input.content)

  const row = getByIdStmt.get(id) as CommentRow
  return rowToDto(row)
}

export const getCommentById = (id: string): CommentDto | null => {
  const row = getByIdStmt.get(id)
  return row ? rowToDto(row) : null
}

export const deleteComment = (id: string): boolean => {
  const result = deleteStmt.run(id)
  return (result.changes ?? 0) > 0
}

export const getCommentCountByMemoryId = (memoryId: string): number => {
  return countByMemoryStmt.get(memoryId)?.count ?? 0
}
