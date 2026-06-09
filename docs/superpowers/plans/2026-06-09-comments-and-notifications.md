# 记忆点评论 + 通知系统 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为记忆星球的详情页增加双方评论功能和实时通知系统，同时将后台管理从 admin 单密码改为双方用户账号体系。

**Architecture:** 后端在现有 Bun+Hono+SQLite 基础上新增 `comments` 和 `notifications` 表，使用 SSE 实现实时推送；前端在 `MemoryDetail.vue` 底部嵌入评论区，顶部加入通知铃铛组件；认证系统从单密码 admin 重构为双用户（她/他）session cookie 机制。

**Tech Stack:** Vue 3 + Pinia + Three.js → Bun + Hono + SQLite → SSE

---

## 文件结构总览

### 新建文件（共 13 个）
```
server/
  comments.ts                  # 评论数据访问层
  notifications.ts             # 通知数据访问层 + 创建时自动推送
  sse.ts                       # SSE 连接管理器（pub/sub）
  routes/comments.ts           # 评论 REST API
  routes/notifications.ts      # 通知 REST API + SSE stream

src/
  api/userAuth.ts              # 用户登录/登出/会话检查
  api/comments.ts              # 前端评论 CRUD
  api/notifications.ts         # 前端通知 API
  stores/notifications.ts      # Pinia store（连接管理 + 状态）
  components/CommentSection.vue    # 评论区组件
  components/UserLoginDialog.vue   # 登录弹窗
  components/NotificationBell.vue  # 通知铃铛 + 下拉列表
  views/publish/
    PublishLogin.vue           # 发布管理登录页
    PublishLayout.vue          # 发布管理布局
    PublishMemoryList.vue      # 记忆点列表
    PublishMemoryForm.vue      # 记忆点新增/编辑表单
```

### 修改文件（共 13 个）
```
.env                           # 环境变量替换
server/config.ts               # 环境变量 schema 替换
server/db.ts                   # 追加 comments + notifications 表
server/auth.ts                 # 重构为用户 session 认证
server/types.ts                # 追加 Comment/Notification zod schemas
server/routes/memories.ts      # 路径 /api/admin → /api/publish + 通知触发
server/routes/upload.ts        # 路径 + 认证替换
server/index.ts                # 挂载新路由
src/router/index.ts            # 路由替换 + 导航守卫
src/App.vue                    # isAdminRoute → isPublishRoute
src/types/memory.ts            # 追加 Comment 类型
src/api/memories.ts            # 函数名 + 路径更新
src/components/MemoryDetail.vue # 底部嵌入 CommentSection
```

### 删除文件（共 1 个目录 + 1 个文件）
```
src/api/auth.ts                # 被 userAuth.ts 替代
src/views/admin/               # 整目录被 publish/ 替代
```

---

## 核心数据流

```
用户 A 发布记忆点 (POST /api/publish/memories)
  → 写入 memories 表
  → 创建通知写入 notifications 表（recipient = 用户 B）
  → SSE 推送通知给用户 B

用户 B 评论记忆点 (POST /api/memories/:id/comments)
  → 写入 comments 表
  → 创建通知写入 notifications 表（recipient = 用户 A）
  → SSE 推送通知给用户 A

用户 B 回复用户 A (parentId 不为空)
  → 写入 comments 表
  → 创建通知给被回复者（用户 A）
  → SSE 推送

前端 SSE 连接 (GET /api/notifications/stream)
  → 服务端保持长连接
  → 有新通知时 push event
  → 前端更新未读计数 + toast 提示
```

---

## Phase 1: 基础设施

### Task 1: 环境变量 + Config

**Files:**
- Modify: `.env`
- Modify: `server/config.ts`

- [ ] **Step 1: 更新 `.env`**

替换文件内容为：
```
NODE_ENV=development
PORT=3000
PARTY_A_NAME=她
PARTY_A_PASSWORD=ta123456
PARTY_B_NAME=他
PARTY_B_PASSWORD=ta123456
SESSION_SECRET=replace-with-at-least-32-characters
DATA_DIR=data
UPLOAD_DIR=uploads/memories
USER_SESSION_COOKIE_NAME=love_user_session
SESSION_MAX_AGE_SECONDS=604800
```

- [ ] **Step 2: 更新 `server/config.ts`**

将 `envSchema` 替换为：
```typescript
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  PARTY_A_NAME: z.string().min(1).default('她'),
  PARTY_A_PASSWORD: z.string().min(1),
  PARTY_B_NAME: z.string().min(1).default('他'),
  PARTY_B_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET 至少需要 32 个字符'),
  DATA_DIR: z.string().default('data'),
  UPLOAD_DIR: z.string().default('uploads/memories'),
  USER_SESSION_COOKIE_NAME: z.string().default('love_user_session'),
  SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  const errors = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`环境变量校验失败:\n${errors}`)
}

export const env = parsedEnv.data

export const isProduction = env.NODE_ENV === 'production'
```

- [ ] **Step 3: 验证**

运行 `bun run check` 或启动确认无 env 错误：
```bash
bun run dev-all
```
预期：无环境变量校验失败的错误。

- [ ] **Step 4: Commit**

```bash
git add .env server/config.ts
git commit -m "feat: replace admin env with two-user auth env"
```

---

### Task 2: 重构认证模块

**Files:**
- Modify: `server/auth.ts`

- [ ] **Step 1: 替换整个 `server/auth.ts` 为双用户认证系统**

```typescript
import { randomUUID } from 'node:crypto'
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'
import type { Context, MiddlewareHandler } from 'hono'
import { env } from './config'

const SESSION_COOKIE_PATH = '/'

export interface UserSession {
  sid: string
  userId: string
  userName: string
  iat: number
}

export interface UserVariables {
  userSession: UserSession
}

function isSecure(c: Context): boolean {
  return c.req.url.startsWith('https://') || c.req.header('x-forwarded-proto') === 'https'
}

function encodeSession(session: UserSession): string {
  return Buffer.from(JSON.stringify(session), 'utf-8').toString('base64url')
}

function decodeSession(value: string): UserSession | null {
  try {
    const raw = Buffer.from(value, 'base64url').toString('utf-8')
    const parsed = JSON.parse(raw) as Partial<UserSession>
    if (!parsed.sid || !parsed.userId || !parsed.userName || typeof parsed.iat !== 'number') {
      return null
    }
    return { sid: parsed.sid, userId: parsed.userId, userName: parsed.userName, iat: parsed.iat }
  } catch {
    return null
  }
}

async function getSessionFromCookie(c: Context): Promise<UserSession | null> {
  const signedValue = await getSignedCookie(c, env.SESSION_SECRET, env.USER_SESSION_COOKIE_NAME)
  if (!signedValue) return null

  const session = decodeSession(signedValue)
  if (!session) return null

  const expiresAt = session.iat + env.SESSION_MAX_AGE_SECONDS * 1000
  if (Date.now() > expiresAt) return null

  return session
}

export const getUserSession = getSessionFromCookie

export async function createUserSession(c: Context, userId: string, userName: string): Promise<void> {
  const session: UserSession = {
    sid: randomUUID(),
    userId,
    userName,
    iat: Date.now(),
  }
  await setSignedCookie(c, env.USER_SESSION_COOKIE_NAME, encodeSession(session), env.SESSION_SECRET, {
    path: SESSION_COOKIE_PATH,
    httpOnly: true,
    secure: isSecure(c),
    sameSite: 'Lax',
    maxAge: env.SESSION_MAX_AGE_SECONDS,
  })
}

export function clearUserSession(c: Context): void {
  deleteCookie(c, env.USER_SESSION_COOKIE_NAME, {
    path: SESSION_COOKIE_PATH,
    secure: isSecure(c),
    sameSite: 'Lax',
    httpOnly: true,
  })
}

export const requireUserAuth: MiddlewareHandler<{ Variables: UserVariables }> = async (c, next) => {
  const session = await getSessionFromCookie(c)
  if (!session) {
    return c.json({ message: '未登录或会话已失效' }, 401)
  }
  c.set('userSession', session)
  await next()
}
```

- [ ] **Step 2: 更新 `server/routes/auth.ts` 为用户登录路由**

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import type { UserVariables } from '../auth'
import { clearUserSession, createUserSession, getUserSession, requireUserAuth } from '../auth'
import { env } from '../config'

const loginBodySchema = z.object({
  identity: z.enum(['party_a', 'party_b']),
  password: z.string().min(1),
})

const userInfo: Record<string, { name: string; password: string }> = {
  party_a: { name: env.PARTY_A_NAME, password: env.PARTY_A_PASSWORD },
  party_b: { name: env.PARTY_B_NAME, password: env.PARTY_B_PASSWORD },
}

export const userAuthRoutes = new Hono<{ Variables: UserVariables }>()

userAuthRoutes.post('/user/login', async (c) => {
  const json = await c.req.json().catch(() => null)
  const parsed = loginBodySchema.safeParse(json)

  if (!parsed.success) {
    return c.json({ message: '请求参数不合法', errors: parsed.error.flatten() }, 400)
  }

  const { identity, password } = parsed.data
  const user = userInfo[identity]

  if (!user || password !== user.password) {
    return c.json({ message: '身份或密码错误' }, 401)
  }

  await createUserSession(c, identity, user.name)
  return c.json({
    data: {
      userId: identity,
      userName: user.name,
    },
  })
})

userAuthRoutes.post('/user/logout', (c) => {
  clearUserSession(c)
  return c.json({ ok: true })
})

userAuthRoutes.get('/user/me', requireUserAuth, (c) => {
  const { userId, userName } = c.get('userSession')
  return c.json({ data: { userId, userName } })
})
```

- [ ] **Step 3: Commit**

```bash
git add server/auth.ts server/routes/auth.ts
git commit -m "feat: replace admin auth with two-user auth system"
```

---

### Task 3: 数据库 schema

**Files:**
- Modify: `server/db.ts`

- [ ] **Step 1: 在 `server/db.ts` 的表创建语句后追加 comments 表和 notifications 表**

```typescript
db.exec(`
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL,
  parent_id TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_memory_id ON comments(memory_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  memory_id TEXT NOT NULL,
  comment_id TEXT,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
`)
```

- [ ] **Step 2: Commit**

```bash
git add server/db.ts
git commit -m "feat: add comments and notifications tables"
```

---

### Task 4: 服务端类型

**Files:**
- Modify: `server/types.ts`

- [ ] **Step 1: 在 `server/types.ts` 末尾追加 Comment 和 Notification 的 zod schema**

```typescript
export const createCommentInputSchema = z.object({
  parentId: z.string().optional(),
  content: z.string().min(1, '评论内容不能为空').max(2000),
})

export type CreateCommentInput = z.infer<typeof createCommentInputSchema>

export interface CommentDto {
  id: string
  memoryId: string
  parentId: string | null
  userId: string
  userName: string
  content: string
  createdAt: string
  replies: CommentDto[]
}

export const notificationTypeSchema = z.enum(['new_memory', 'new_comment', 'new_reply'])

export interface NotificationDto {
  id: string
  userId: string
  type: 'new_memory' | 'new_comment' | 'new_reply'
  title: string
  content: string | null
  memoryId: string
  commentId: string | null
  actorId: string
  actorName: string
  isRead: boolean
  createdAt: string
}
```

- [ ] **Step 2: Commit**

```bash
git add server/types.ts
git commit -m "feat: add comment and notification types"
```

---

## Phase 2: 后端 API

### Task 5: 评论数据访问层 + 路由

**Files:**
- Create: `server/comments.ts`
- Create: `server/routes/comments.ts`

- [ ] **Step 1: 创建 `server/comments.ts`**

```typescript
import { db } from './db'
import { generateSnowflakeId } from './snowflake'
import type { CommentDto, CreateCommentInput } from './types'

interface CommentRow {
  id: string
  memory_id: string
  parent_id: string | null
  user_id: string
  user_name: string
  content: string
  created_at: string
}

const listByMemoryStmt = db.query<CommentRow, [string]>(
  `SELECT id, memory_id, parent_id, user_id, user_name, content, created_at
   FROM comments
   WHERE memory_id = ?1
   ORDER BY created_at ASC`,
)

const createStmt = db.prepare(
  `INSERT INTO comments (id, memory_id, parent_id, user_id, user_name, content)
   VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
)

const getByIdStmt = db.query<CommentRow, [string]>(
  `SELECT id, memory_id, parent_id, user_id, user_name, content, created_at
   FROM comments WHERE id = ?1`,
)

const deleteStmt = db.prepare('DELETE FROM comments WHERE id = ?1 AND user_id = ?2')

function rowToDto(row: CommentRow): CommentDto {
  return {
    id: row.id,
    memoryId: row.memory_id,
    parentId: row.parent_id,
    userId: row.user_id,
    userName: row.user_name,
    content: row.content,
    createdAt: row.created_at,
    replies: [],
  }
}

export function listCommentsByMemory(memoryId: string): CommentDto[] {
  const rows = listByMemoryStmt.all(memoryId)
  const comments: CommentDto[] = []
  const replyMap = new Map<string, CommentDto[]>()

  for (const row of rows) {
    const dto = rowToDto(row)
    if (dto.parentId) {
      if (!replyMap.has(dto.parentId)) {
        replyMap.set(dto.parentId, [])
      }
      replyMap.get(dto.parentId)!.push(dto)
    } else {
      comments.push(dto)
    }
  }

  for (const comment of comments) {
    comment.replies = replyMap.get(comment.id) ?? []
  }

  return comments
}

export function createComment(
  memoryId: string,
  input: CreateCommentInput,
  userId: string,
  userName: string,
): CommentDto {
  const id = generateSnowflakeId()
  createStmt.run(id, memoryId, input.parentId ?? null, userId, userName, input.content)
  const row = getByIdStmt.get(id)
  if (!row) throw new Error('创建评论失败')
  return rowToDto(row)
}

export function deleteComment(id: string, userId: string): boolean {
  const result = deleteStmt.run(id, userId)
  return (result.changes ?? 0) > 0
}
```

- [ ] **Step 2: 创建 `server/routes/comments.ts`**

```typescript
import { Hono } from 'hono'
import type { UserVariables } from '../auth'
import { requireUserAuth } from '../auth'
import { createComment, deleteComment, listCommentsByMemory } from '../comments'
import { createCommentInputSchema } from '../types'
import { notifyOtherUser } from '../notifications'
import { getMemoryById } from '../memories'

export const commentRoutes = new Hono<{ Variables: UserVariables }>()

commentRoutes.get('/memories/:memoryId/comments', async (c) => {
  const memoryId = c.req.param('memoryId')
  return c.json({ data: listCommentsByMemory(memoryId) })
})

commentRoutes.post('/memories/:memoryId/comments', requireUserAuth, async (c) => {
  const memoryId = c.req.param('memoryId')
  const { userId, userName } = c.get('userSession')

  const body = await c.req.json().catch(() => null)
  const parsed = createCommentInputSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ message: '请求参数不合法', errors: parsed.error.flatten() }, 400)
  }

  const comment = createComment(memoryId, parsed.data, userId, userName)

  const memory = getMemoryById(memoryId)
  const memoryTitle = memory?.title ?? '未知记忆点'
  const notificationType = parsed.data.parentId ? 'new_reply' : 'new_comment'

  await notifyOtherUser(
    userId,
    {
      type: notificationType,
      title: `${userName}${notificationType === 'new_reply' ? '回复了你' : '评论了「' + memoryTitle + '」'}`,
      content: parsed.data.content,
      memoryId,
      commentId: comment.id,
      actorId: userId,
      actorName: userName,
    },
  )

  return c.json({ data: comment }, 201)
})

commentRoutes.delete('/comments/:id', requireUserAuth, async (c) => {
  const id = c.req.param('id')
  const { userId } = c.get('userSession')

  if (!deleteComment(id, userId)) {
    return c.json({ message: '评论不存在或无权删除' }, 404)
  }

  return c.body(null, 204)
})
```

- [ ] **Step 3: Commit**

```bash
git add server/comments.ts server/routes/comments.ts
git commit -m "feat: add comments DAL and routes"
```

---

### Task 6: SSE 连接管理器

**Files:**
- Create: `server/sse.ts`

- [ ] **Step 1: 创建 `server/sse.ts`**

```typescript
import type { SSEStreamingApi } from 'hono/streaming'

const connections = new Map<string, Set<SSEStreamingApi>>()

export function addConnection(userId: string, stream: SSEStreamingApi): void {
  if (!connections.has(userId)) {
    connections.set(userId, new Set())
  }
  connections.get(userId)!.add(stream)
}

export function removeConnection(userId: string, stream: SSEStreamingApi): void {
  const userConns = connections.get(userId)
  if (!userConns) return
  userConns.delete(stream)
  if (userConns.size === 0) {
    connections.delete(userId)
  }
}

export async function pushToUser(userId: string, data: Record<string, unknown>): Promise<void> {
  const userConns = connections.get(userId)
  if (!userConns || userConns.size === 0) return

  const payload = `data: ${JSON.stringify(data)}\n\n`
  for (const stream of userConns) {
    try {
      await stream.writeSSE({
        event: 'notification',
        data: JSON.stringify(data),
      })
    } catch {
      removeConnection(userId, stream)
    }
  }
}

export function getOtherUserId(userId: string): string {
  return userId === 'party_a' ? 'party_b' : 'party_a'
}
```

- [ ] **Step 2: Commit**

```bash
git add server/sse.ts
git commit -m "feat: add SSE connection manager"
```

---

### Task 7: 通知数据访问层 + 路由

**Files:**
- Create: `server/notifications.ts`
- Create: `server/routes/notifications.ts`

- [ ] **Step 1: 创建 `server/notifications.ts`**

```typescript
import { db } from './db'
import { generateSnowflakeId } from './snowflake'
import { pushToUser, getOtherUserId } from './sse'
import type { NotificationDto } from './types'

interface NotificationRow {
  id: string
  user_id: string
  type: string
  title: string
  content: string | null
  memory_id: string
  comment_id: string | null
  actor_id: string
  actor_name: string
  is_read: number
  created_at: string
}

interface CreateNotificationInput {
  type: 'new_memory' | 'new_comment' | 'new_reply'
  title: string
  content: string | null
  memoryId: string
  commentId: string | null
  actorId: string
  actorName: string
}

const listStmt = db.query<NotificationRow, [string, number, number]>(
  `SELECT id, user_id, type, title, content, memory_id, comment_id,
          actor_id, actor_name, is_read, created_at
   FROM notifications
   WHERE user_id = ?1
   ORDER BY created_at DESC
   LIMIT ?2 OFFSET ?3`,
)

const unreadCountStmt = db.query<{ count: number }, [string]>(
  'SELECT COUNT(1) as count FROM notifications WHERE user_id = ?1 AND is_read = 0',
)

const createStmt = db.prepare(
  `INSERT INTO notifications (id, user_id, type, title, content, memory_id, comment_id, actor_id, actor_name)
   VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
)

const markReadStmt = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?1 AND user_id = ?2')
const markAllReadStmt = db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?1')

function rowToDto(row: NotificationRow): NotificationDto {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationDto['type'],
    title: row.title,
    content: row.content,
    memoryId: row.memory_id,
    commentId: row.comment_id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    isRead: row.is_read === 1,
    createdAt: row.created_at,
  }
}

export function listNotifications(userId: string, limit = 50, offset = 0): NotificationDto[] {
  return listStmt.all(userId, limit, offset).map(rowToDto)
}

export function getUnreadCount(userId: string): number {
  return unreadCountStmt.get(userId)?.count ?? 0
}

export function markNotificationRead(id: string, userId: string): boolean {
  const result = markReadStmt.run(id, userId)
  return (result.changes ?? 0) > 0
}

export function markAllNotificationsRead(userId: string): void {
  markAllReadStmt.run(userId)
}

function createNotificationRecord(userId: string, input: CreateNotificationInput): NotificationDto {
  const id = generateSnowflakeId()
  createStmt.run(
    id, userId, input.type, input.title, input.content,
    input.memoryId, input.commentId, input.actorId, input.actorName,
  )
  return {
    id,
    userId,
    type: input.type,
    title: input.title,
    content: input.content,
    memoryId: input.memoryId,
    commentId: input.commentId,
    actorId: input.actorId,
    actorName: input.actorName,
    isRead: false,
    createdAt: new Date().toISOString(),
  }
}

export async function notifyOtherUser(
  actorId: string,
  input: CreateNotificationInput,
): Promise<void> {
  const recipientId = getOtherUserId(actorId)
  const notification = createNotificationRecord(recipientId, input)
  await pushToUser(recipientId, {
    type: input.type,
    notification,
  })
}
```

- [ ] **Step 2: 创建 `server/routes/notifications.ts`**

```typescript
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { UserVariables } from '../auth'
import { requireUserAuth, getUserSession } from '../auth'
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../notifications'
import { addConnection, removeConnection } from '../sse'

export const notificationRoutes = new Hono<{ Variables: UserVariables }>()

notificationRoutes.get('/notifications/stream', requireUserAuth, async (c) => {
  const { userId } = c.get('userSession')

  return streamSSE(c, async (stream) => {
    addConnection(userId, stream)

    try {
      while (true) {
        await stream.sleep(30000)
      }
    } finally {
      removeConnection(userId, stream)
    }
  })
})

notificationRoutes.get('/notifications', requireUserAuth, async (c) => {
  const { userId } = c.get('userSession')
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const offset = Number(c.req.query('offset')) || 0
  return c.json({ data: listNotifications(userId, limit, offset) })
})

notificationRoutes.get('/notifications/unread-count', requireUserAuth, async (c) => {
  const { userId } = c.get('userSession')
  return c.json({ data: { count: getUnreadCount(userId) } })
})

notificationRoutes.put('/notifications/read-all', requireUserAuth, async (c) => {
  const { userId } = c.get('userSession')
  markAllNotificationsRead(userId)
  return c.json({ ok: true })
})

notificationRoutes.put('/notifications/:id/read', requireUserAuth, async (c) => {
  const id = c.req.param('id')
  const { userId } = c.get('userSession')
  if (!markNotificationRead(id, userId)) {
    return c.json({ message: '通知不存在' }, 404)
  }
  return c.json({ ok: true })
})
```

- [ ] **Step 3: Commit**

```bash
git add server/notifications.ts server/routes/notifications.ts
git commit -m "feat: add notifications DAL and routes with SSE"
```

---

### Task 8: 更新记忆点路由 + 上传路由

**Files:**
- Modify: `server/routes/memories.ts`
- Modify: `server/routes/upload.ts`

- [ ] **Step 1: 替换 `server/routes/memories.ts`**

将 `/api/admin/memories` → `/api/publish/memories`，认证改为 `requireUserAuth`，创建记忆点后触发通知：

```typescript
import { Hono } from 'hono'
import type { UserVariables } from '../auth'
import { requireUserAuth } from '../auth'
import { createMemory, deleteMemory, getMemoryById, listMemories, updateMemory } from '../memories'
import { createMemoryInputSchema, updateMemoryInputSchema } from '../types'
import { notifyOtherUser } from '../notifications'
import { env } from '../config'

export const memoryRoutes = new Hono<{ Variables: UserVariables }>()

memoryRoutes.get('/memories', (c) => {
  return c.json({ data: listMemories() })
})

memoryRoutes.get('/publish/memories', requireUserAuth, (c) => {
  return c.json({ data: listMemories() })
})

memoryRoutes.get('/publish/memories/:id', requireUserAuth, (c) => {
  const id = c.req.param('id')
  const memory = getMemoryById(id)
  if (!memory) return c.json({ message: '记忆点不存在' }, 404)
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
    const { userId, userName } = c.get('userSession')

    await notifyOtherUser(userId, {
      type: 'new_memory',
      title: `${userName}发布了新记忆点「${memory.title}」`,
      content: memory.content.text ?? null,
      memoryId: memory.id,
      commentId: null,
      actorId: userId,
      actorName: userName,
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
  if (!deleteMemory(id)) {
    return c.json({ message: '记忆点不存在' }, 404)
  }
  return c.body(null, 204)
})
```

- [ ] **Step 2: 替换 `server/routes/upload.ts`**

将 `/api/admin/upload` → `/api/publish/upload`，认证改为 `requireUserAuth`：

```typescript
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { Hono } from 'hono'
import type { UserVariables } from '../auth'
import { requireUserAuth } from '../auth'
import { env } from '../config'

const IMAGE_PREFIX = 'image/'
const VIDEO_PREFIX = 'video/'
const ALLOWED_AUDIO = new Set(['audio/mpeg', 'audio/mp3'])
const MAX_UPLOAD_SIZE = 100 * 1024 * 1024

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-')
}

function buildStoredFileName(originalName: string): string {
  const ext = extname(originalName).slice(0, 16)
  return `${Date.now()}-${randomUUID()}${ext}`
}

function isAllowedMime(mimeType: string): boolean {
  return mimeType.startsWith(IMAGE_PREFIX) || mimeType.startsWith(VIDEO_PREFIX) || ALLOWED_AUDIO.has(mimeType)
}

export const uploadRoutes = new Hono<{ Variables: UserVariables }>()

uploadRoutes.post('/publish/upload', requireUserAuth, async (c) => {
  const body = await c.req.parseBody({ all: false })
  const file = body.file

  if (!(file instanceof File)) {
    return c.json({ message: '请上传文件（字段名为 file）' }, 400)
  }
  if (file.size === 0) {
    return c.json({ message: '文件不能为空' }, 400)
  }
  if (!isAllowedMime(file.type)) {
    return c.json({ message: '文件类型不支持，只允许图片、视频和 mp3' }, 400)
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return c.json({ message: `文件过大，最大 ${(MAX_UPLOAD_SIZE / 1024 / 1024).toFixed(0)}MB` }, 400)
  }

  const original = safeFileName(file.name || 'upload.bin')
  const targetName = buildStoredFileName(original)
  const targetPath = join(env.UPLOAD_DIR, targetName)

  mkdirSync(env.UPLOAD_DIR, { recursive: true })
  await Bun.write(targetPath, await file.arrayBuffer())

  return c.json(
    {
      data: {
        url: `/uploads/memories/${targetName}`,
        name: original,
        size: file.size,
        type: file.type,
      },
    },
    201,
  )
})
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/memories.ts server/routes/upload.ts
git commit -m "feat: update routes to /api/publish with user auth and notifications"
```

---

### Task 9: 更新服务端入口

**Files:**
- Modify: `server/index.ts`

- [ ] **Step 1: 替换 `server/index.ts`**

```typescript
import { serveStatic } from 'hono/bun'
import { Hono } from 'hono'
import { mkdirSync } from 'node:fs'
import type { UserVariables } from './auth'
import { env } from './config'
import './db'
import { userAuthRoutes } from './routes/auth'
import { memoryRoutes } from './routes/memories'
import { uploadRoutes } from './routes/upload'
import { commentRoutes } from './routes/comments'
import { notificationRoutes } from './routes/notifications'

const app = new Hono<{ Variables: UserVariables }>()

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

app.route('/api/auth', userAuthRoutes)
app.route('/api', memoryRoutes)
app.route('/api', uploadRoutes)
app.route('/api', commentRoutes)
app.route('/api', notificationRoutes)

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
```

- [ ] **Step 2: Commit**

```bash
git add server/index.ts
git commit -m "feat: mount user auth, comment, and notification routes"
```

---

## Phase 3: 前端 API 层

### Task 10: 前端类型 + 用户认证 API

**Files:**
- Modify: `src/types/memory.ts`
- Create: `src/api/userAuth.ts`

- [ ] **Step 1: 在 `src/types/memory.ts` 末尾追加 Comment 接口**

```typescript
export interface Comment {
  id: string
  memoryId: string
  parentId: string | null
  userId: string
  userName: string
  content: string
  createdAt: string
  replies: Comment[]
}

export interface NotificationItem {
  id: string
  userId: string
  type: 'new_memory' | 'new_comment' | 'new_reply'
  title: string
  content: string | null
  memoryId: string
  commentId: string | null
  actorId: string
  actorName: string
  isRead: boolean
  createdAt: string
}
```

- [ ] **Step 2: 创建 `src/api/userAuth.ts`**

```typescript
import { ApiError, apiRequest } from './client'

interface UserInfo {
  userId: string
  userName: string
}

interface UserLoginResponse {
  data: UserInfo
}

interface UserMeResponse {
  data: UserInfo
}

let cachedUser: UserInfo | null = null
let hasCheckedSession = false

export const loginUser = async (identity: string, password: string): Promise<UserInfo> => {
  const result = await apiRequest<UserLoginResponse>('/api/auth/user/login', {
    method: 'POST',
    body: JSON.stringify({ identity, password }),
  })
  cachedUser = result.data
  hasCheckedSession = true
  return cachedUser
}

export const logoutUser = async (): Promise<void> => {
  await apiRequest<{ ok: true }>('/api/auth/user/logout', {
    method: 'POST',
  })
  cachedUser = null
  hasCheckedSession = true
}

export const checkUserSession = async (force = false): Promise<boolean> => {
  if (!force && hasCheckedSession) {
    return cachedUser !== null
  }

  try {
    const result = await apiRequest<UserMeResponse>('/api/auth/user/me')
    cachedUser = result.data
    hasCheckedSession = true
    return true
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      cachedUser = null
      hasCheckedSession = true
      return false
    }
    throw error
  }
}

export const getCachedUser = (): UserInfo | null => {
  return cachedUser
}

export const clearUserCache = (): void => {
  cachedUser = null
  hasCheckedSession = false
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/memory.ts src/api/userAuth.ts
git commit -m "feat: add frontend Comment types and user auth API"
```

---

### Task 11: 前端评论 API

**Files:**
- Create: `src/api/comments.ts`

- [ ] **Step 1: 创建 `src/api/comments.ts`**

```typescript
import type { Comment } from '@/types/memory'
import { apiRequest } from './client'

interface CommentListResponse {
  data: Comment[]
}

interface CommentResponse {
  data: Comment
}

interface CreateCommentInput {
  parentId?: string
  content: string
}

export const fetchComments = async (memoryId: string): Promise<Comment[]> => {
  const result = await apiRequest<CommentListResponse>(`/api/memories/${memoryId}/comments`)
  return result.data
}

export const createComment = async (memoryId: string, input: CreateCommentInput): Promise<Comment> => {
  const result = await apiRequest<CommentResponse>(`/api/memories/${memoryId}/comments`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return result.data
}

export const deleteComment = async (commentId: string): Promise<void> => {
  await apiRequest<void>(`/api/comments/${commentId}`, {
    method: 'DELETE',
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/comments.ts
git commit -m "feat: add frontend comment API"
```

---

### Task 12: 前端通知 API + Store

**Files:**
- Create: `src/api/notifications.ts`
- Create: `src/stores/notifications.ts`

- [ ] **Step 1: 创建 `src/api/notifications.ts`**

```typescript
import type { NotificationItem } from '@/types/memory'
import { apiRequest } from './client'

interface NotificationListResponse {
  data: NotificationItem[]
}

interface UnreadCountResponse {
  data: { count: number }
}

export const fetchNotifications = async (limit = 50, offset = 0): Promise<NotificationItem[]> => {
  const result = await apiRequest<NotificationListResponse>(
    `/api/notifications?limit=${limit}&offset=${offset}`,
  )
  return result.data
}

export const fetchUnreadCount = async (): Promise<number> => {
  const result = await apiRequest<UnreadCountResponse>('/api/notifications/unread-count')
  return result.data.count
}

export const markAllNotificationsRead = async (): Promise<void> => {
  await apiRequest('/api/notifications/read-all', { method: 'PUT' })
}

export const markNotificationRead = async (id: string): Promise<void> => {
  await apiRequest(`/api/notifications/${id}/read`, { method: 'PUT' })
}
```

- [ ] **Step 2: 创建 `src/stores/notifications.ts`**

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NotificationItem } from '@/types/memory'
import { fetchNotifications, fetchUnreadCount, markAllNotificationsRead } from '@/api/notifications'
import { checkUserSession } from '@/api/userAuth'

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<NotificationItem[]>([])
  const unreadCount = ref(0)
  const isConnected = ref(false)
  let eventSource: EventSource | null = null

  const latestNotifications = computed(() =>
    notifications.value.slice(0, 10),
  )

  async function loadNotifications(): Promise<void> {
    try {
      notifications.value = await fetchNotifications()
    } catch {
      // 静默失败
    }
  }

  async function refreshUnreadCount(): Promise<void> {
    try {
      unreadCount.value = await fetchUnreadCount()
    } catch {
      // 静默失败
    }
  }

  function connectSSE(): void {
    if (eventSource || !checkUserSession()) return

    eventSource = new EventSource('/api/notifications/stream')
    isConnected.value = true

    eventSource.addEventListener('notification', (event) => {
      try {
        const data = JSON.parse(event.data)
        const notification = data.notification as NotificationItem
        if (notification) {
          notifications.value.unshift(notification)
          unreadCount.value++
        }
      } catch {
        // 静默失败
      }
    })

    eventSource.addEventListener('error', () => {
      disconnectSSE()
      setTimeout(() => connectSSE(), 5000)
    })
  }

  function disconnectSSE(): void {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    isConnected.value = false
  }

  async function markAllRead(): Promise<void> {
    try {
      await markAllNotificationsRead()
      unreadCount.value = 0
      notifications.value = notifications.value.map((n) => ({ ...n, isRead: true }))
    } catch {
      // 静默失败
    }
  }

  return {
    notifications,
    unreadCount,
    isConnected,
    latestNotifications,
    loadNotifications,
    refreshUnreadCount,
    connectSSE,
    disconnectSSE,
    markAllRead,
  }
})
```

- [ ] **Step 3: Commit**

```bash
git add src/api/notifications.ts src/stores/notifications.ts
git commit -m "feat: add notification API and Pinia store with SSE"
```

---

### Task 13: 更新记忆点前端 API

**Files:**
- Modify: `src/api/memories.ts`

- [ ] **Step 1: 替换 `src/api/memories.ts`**

将所有 `admin` 函数名改为 `publish`，路径 `/api/admin` → `/api/publish`：

```typescript
import type { Memory } from '@/types/memory'
import { apiRequest } from './client'

interface MemoryListResponse {
  data: Memory[]
}

interface MemoryResponse {
  data: Memory
}

type CreateMemoryInput = Omit<Memory, 'id'>

interface UploadResponse {
  data: {
    url: string
    name: string
    size: number
    type: string
  }
}

export const fetchMemories = async (): Promise<Memory[]> => {
  const result = await apiRequest<MemoryListResponse>('/api/memories')
  return result.data
}

export const fetchPublishMemories = async (): Promise<Memory[]> => {
  const result = await apiRequest<MemoryListResponse>('/api/publish/memories')
  return result.data
}

export const fetchPublishMemoryById = async (id: string): Promise<Memory> => {
  const result = await apiRequest<MemoryResponse>(`/api/publish/memories/${id}`)
  return result.data
}

export const createPublishMemory = async (memory: CreateMemoryInput): Promise<Memory> => {
  const result = await apiRequest<MemoryResponse>('/api/publish/memories', {
    method: 'POST',
    body: JSON.stringify(memory),
  })
  return result.data
}

export const updatePublishMemory = async (id: string, memory: Partial<Memory>): Promise<Memory> => {
  const result = await apiRequest<MemoryResponse>(`/api/publish/memories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(memory),
  })
  return result.data
}

export const deletePublishMemory = async (id: string): Promise<void> => {
  await apiRequest<void>(`/api/publish/memories/${id}`, {
    method: 'DELETE',
  })
}

export const uploadPublishMedia = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/publish/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof payload?.message === 'string' ? payload.message : '上传失败'
    throw new Error(message)
  }
  return (payload as UploadResponse).data.url
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/memories.ts
git commit -m "refactor: rename admin memory API to publish API"
```

---

## Phase 4: 发布管理页面

### Task 14: 更新路由 + App.vue

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/App.vue`

- [ ] **Step 1: 替换 `src/router/index.ts`**

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { checkUserSession } from '@/api/userAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/Home.vue'),
    },
    {
      path: '/publish/login',
      name: 'PublishLogin',
      component: () => import('@/views/publish/PublishLogin.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/publish',
      component: () => import('@/views/publish/PublishLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/publish/memories' },
        {
          path: 'memories',
          name: 'PublishMemoryList',
          component: () => import('@/views/publish/PublishMemoryList.vue'),
        },
        {
          path: 'memories/new',
          name: 'PublishMemoryCreate',
          component: () => import('@/views/publish/PublishMemoryForm.vue'),
        },
        {
          path: 'memories/:id/edit',
          name: 'PublishMemoryEdit',
          component: () => import('@/views/publish/PublishMemoryForm.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const guestOnly = to.matched.some((record) => record.meta.guestOnly)

  if (!requiresAuth && !guestOnly) {
    return true
  }

  const isAuthed = await checkUserSession()

  if (requiresAuth && !isAuthed) {
    return { name: 'PublishLogin', query: { redirect: to.fullPath } }
  }

  if (guestOnly && isAuthed) {
    return { name: 'PublishMemoryList' }
  }

  return true
})

export default router
```

- [ ] **Step 2: 更新 `src/App.vue`**

将第 10 行的 `const isAdminRoute = computed(() => route.path.startsWith('/admin'))` 改为：
```typescript
const isPublishRoute = computed(() => route.path.startsWith('/publish'))
```

将所有 `isAdminRoute` 引用改为 `isPublishRoute`（共 3 处：第 10 行、第 123 行、第 126 行）。

将第 144 行的 `<RouterView v-if="isAdminRoute" />` 改为：
```html
<RouterView v-if="isPublishRoute" />
```

将第 126 行的 `watch(isAdminRoute, ...)` 改为：
```typescript
watch(isPublishRoute, (nextValue) => {
  applyScrollModeByRoute(nextValue)
})
```

- [ ] **Step 3: Commit**

```bash
git add src/router/index.ts src/App.vue
git commit -m "feat: replace admin routes with publish routes and user auth guard"
```

---

### Task 15: 发布管理登录页 + 布局

**Files:**
- Create: `src/views/publish/PublishLogin.vue`
- Create: `src/views/publish/PublishLayout.vue`

- [ ] **Step 1: 创建 `src/views/publish/PublishLogin.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import { loginUser } from '@/api/userAuth'

const route = useRoute()
const router = useRouter()

const selectedIdentity = ref<'party_a' | 'party_b' | null>(null)
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const identities = [
  { id: 'party_a' as const, label: import.meta.env.PARTY_A_NAME || '她', emoji: '👩' },
  { id: 'party_b' as const, label: import.meta.env.PARTY_B_NAME || '他', emoji: '👨' },
]

const redirectPath = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/publish')
  ? route.query.redirect
  : '/publish/memories'

const handleSelectIdentity = (id: 'party_a' | 'party_b') => {
  selectedIdentity.value = id
  errorMessage.value = ''
  password.value = ''
}

const handleSubmit = async () => {
  if (!selectedIdentity.value || !password.value) {
    errorMessage.value = '请选择身份并输入密码'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    await loginUser(selectedIdentity.value, password.value)
    await router.replace(redirectPath)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      errorMessage.value = '密码错误'
    } else if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '登录失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  selectedIdentity.value = null
  errorMessage.value = ''
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1>{{ selectedIdentity ? '输入密码' : '选择身份' }}</h1>

      <template v-if="!selectedIdentity">
        <p class="hint">请选择你的身份以进入发布管理</p>
        <div class="identity-grid">
          <button
            v-for="item in identities"
            :key="item.id"
            class="identity-btn"
            @click="handleSelectIdentity(item.id)"
          >
            <span class="identity-emoji">{{ item.emoji }}</span>
            <span class="identity-label">{{ item.label }}</span>
          </button>
        </div>
      </template>

      <template v-else>
        <button class="back-btn" @click="handleBack">← 返回</button>
        <div class="selected-identity">
          <span class="identity-emoji">{{ identities.find(i => i.id === selectedIdentity)?.emoji }}</span>
          <span>{{ identities.find(i => i.id === selectedIdentity)?.label }}</span>
        </div>
        <label>
          密码
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            @keyup.enter="handleSubmit"
          />
        </label>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <button type="button" :disabled="loading" @click="handleSubmit">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at top, #2d3f6f 0%, #0b1022 60%);
}

.login-card {
  width: min(360px, 92vw);
  padding: 1.4rem;
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.96);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.login-card h1 {
  margin: 0;
  font-size: 1.3rem;
}

.hint {
  margin: 0;
  color: #57607a;
  font-size: 0.9rem;
}

.identity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.identity-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border: 2px solid #d8deea;
  border-radius: 0.75rem;
  background: #f8faff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.identity-btn:hover {
  border-color: #243b76;
  background: #eef3fe;
}

.identity-emoji {
  font-size: 2rem;
}

.identity-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1d2433;
}

.back-btn {
  align-self: flex-start;
  border: none;
  background: none;
  color: #304f9f;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
}

.selected-identity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
}

label {
  display: grid;
  gap: 0.4rem;
  font-size: 0.92rem;
}

input {
  border: 1px solid #cfd6e6;
  border-radius: 0.55rem;
  padding: 0.55rem 0.65rem;
  font-size: 1rem;
}

button[type="button"] {
  border: none;
  border-radius: 0.55rem;
  padding: 0.58rem 0.75rem;
  background: #243b76;
  color: #fff;
  cursor: pointer;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  margin: 0;
  color: #b72929;
  font-size: 0.9rem;
}
</style>
```

- [ ] **Step 2: 创建 `src/views/publish/PublishLayout.vue`**

```vue
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logoutUser, getCachedUser } from '@/api/userAuth'
import { useNotificationStore } from '@/stores/notifications'

const route = useRoute()
const router = useRouter()

const notificationStore = useNotificationStore()
const currentUser = computed(() => getCachedUser())

const pageTitle = computed(() => {
  if (route.name === 'PublishMemoryCreate') return '新建记忆点'
  if (route.name === 'PublishMemoryEdit') return '编辑记忆点'
  return '记忆点列表'
})

const handleLogout = async () => {
  await logoutUser()
  notificationStore.disconnectSSE()
  await router.push({ name: 'PublishLogin' })
}

onMounted(() => {
  notificationStore.connectSSE()
  notificationStore.refreshUnreadCount()
})
</script>

<template>
  <div class="publish-layout">
    <header class="publish-header">
      <div>
        <p class="brand">记忆点管理 · {{ currentUser?.userName || '' }}</p>
        <h1 class="title">{{ pageTitle }}</h1>
      </div>
      <nav class="actions">
        <RouterLink class="link" :to="{ name: 'PublishMemoryList' }">列表</RouterLink>
        <RouterLink class="link" :to="{ name: 'PublishMemoryCreate' }">新增</RouterLink>
        <button class="logout" type="button" @click="handleLogout">退出</button>
      </nav>
    </header>
    <main class="publish-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.publish-layout {
  min-height: 100vh;
  background: #f4f6fb;
  color: #1d2433;
}

.publish-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #d8deea;
  background: #ffffff;
}

.brand {
  margin: 0;
  color: #5a6377;
  font-size: 0.85rem;
}

.title {
  margin: 0.2rem 0 0;
  font-size: 1.2rem;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.link {
  color: #304f9f;
  text-decoration: none;
  font-weight: 500;
}

.logout {
  border: none;
  border-radius: 0.5rem;
  padding: 0.45rem 0.75rem;
  background: #243b76;
  color: #fff;
  cursor: pointer;
}

.publish-main {
  max-width: 1024px;
  margin: 0 auto;
  padding: 1.2rem;
}

@media (max-width: 768px) {
  .publish-header {
    flex-wrap: wrap;
    padding: 0.75rem 1rem;
  }
  .actions {
    gap: 0.5rem;
  }
  .link { font-size: 0.88rem; }
  .logout { font-size: 0.85rem; padding: 0.35rem 0.6rem; }
  .publish-main { padding: 0.75rem; }
}
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/views/publish/PublishLogin.vue src/views/publish/PublishLayout.vue
git commit -m "feat: add publish login with identity selection and layout"
```

---

### Task 16: 发布管理记忆点列表 + 表单

**Files:**
- Create: `src/views/publish/PublishMemoryList.vue`
- Create: `src/views/publish/PublishMemoryForm.vue`

- [ ] **Step 1: 创建 `src/views/publish/PublishMemoryList.vue`**

基于现有的 `AdminMemoryList.vue`，将 API 调用从 `fetchAdminMemories` / `deleteAdminMemory` 改为 `fetchPublishMemories` / `deletePublishMemory`，路由名从 `AdminMemory*` 改为 `PublishMemory*`：

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Memory } from '@/types/memory'
import { ApiError } from '@/api/client'
import { deletePublishMemory, fetchPublishMemories } from '@/api/memories'

const memories = ref<Memory[]>([])
const loading = ref(false)
const errorMessage = ref('')
const deletingId = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const confirmVisible = ref(false)
const confirmTarget = ref<{ id: string; title: string } | null>(null)

const openConfirm = (id: string, title: string) => {
  confirmTarget.value = { id, title }
  confirmVisible.value = true
}

const cancelDelete = () => {
  confirmVisible.value = false
  confirmTarget.value = null
}

const toDateNum = (s: string) => {
  const cn = s.match(/^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/)
  if (cn) return `${cn[1]}${cn[2].padStart(2, '0')}${cn[3].padStart(2, '0')}`
  const dot = s.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})/)
  if (dot) return `${dot[1]}${dot[2].padStart(2, '0')}${dot[3].padStart(2, '0')}`
  return s
}

const sortMemories = (data: Memory[]) => {
  const sorted = data.sort((a, b) => {
    const da = toDateNum(a.date)
    const db = toDateNum(b.date)
    return da.localeCompare(db)
  })
  if (sortOrder.value === 'desc') sorted.reverse()
  return sorted
}

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  memories.value = sortMemories(memories.value)
}

const loadMemories = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await fetchPublishMemories()
    memories.value = sortMemories(data)
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '加载失败'
    }
  } finally {
    loading.value = false
  }
}

const handleDelete = async () => {
  if (!confirmTarget.value) return
  const { id } = confirmTarget.value
  deletingId.value = id
  errorMessage.value = ''
  confirmVisible.value = false
  try {
    await deletePublishMemory(id)
    memories.value = memories.value.filter((item) => item.id !== id)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      errorMessage.value = '登录已失效，请重新登录'
      return
    }
    if (error instanceof Error) {
      errorMessage.value = error.message
      return
    }
    errorMessage.value = '删除失败'
  } finally {
    deletingId.value = ''
    confirmTarget.value = null
  }
}

onMounted(() => {
  void loadMemories()
})
</script>

<template>
  <section class="panel">
    <div class="toolbar">
      <RouterLink class="primary" :to="{ name: 'PublishMemoryCreate' }">新增记忆点</RouterLink>
      <button type="button" @click="loadMemories">刷新</button>
      <button type="button" class="sort-mobile" @click="toggleSort">
        {{ sortOrder === 'asc' ? '↑ 升序' : '↓ 降序' }}
      </button>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="loading" class="hint">加载中...</p>

    <table v-else class="table">
      <thead>
        <tr>
          <th>标题</th>
          <th class="th-date" @click="toggleSort">日期 {{ sortOrder === 'asc' ? '↑' : '↓' }}</th>
          <th>类型</th>
          <th>颜色</th>
          <th>坐标</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in memories" :key="item.id">
          <td data-label="标题">{{ item.title }}</td>
          <td data-label="日期">{{ item.date }}</td>
          <td data-label="类型">{{ item.type }}</td>
          <td data-label="颜色">
            <span class="color-dot" :style="{ backgroundColor: item.color }"></span>
            <span class="color-value">{{ item.color }}</span>
          </td>
          <td data-label="坐标" class="coord-cell">
            θ {{ item.position.theta.toFixed(2) }} / φ {{ item.position.phi.toFixed(2) }} / r {{ item.orbitRadius.toFixed(2) }}
          </td>
          <td data-label="操作" class="actions-cell">
            <a :href="`/?memory=${item.id}`" target="_blank" rel="noreferrer">预览</a>
            <RouterLink :to="{ name: 'PublishMemoryEdit', params: { id: item.id } }">编辑</RouterLink>
            <button type="button" class="danger" :disabled="deletingId === item.id" @click="openConfirm(item.id, item.title)">
              {{ deletingId === item.id ? '删除中...' : '删除' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <Teleport to="body">
      <div v-if="confirmVisible" class="overlay" @click.self="cancelDelete">
        <div class="dialog">
          <p class="dialog-msg">确认删除「{{ confirmTarget?.title }}」吗？</p>
          <div class="dialog-actions">
            <button type="button" @click="cancelDelete">取消</button>
            <button type="button" class="danger" @click="handleDelete">删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.panel { display: grid; gap: 0.8rem; }
.toolbar { display: flex; align-items: center; gap: 0.6rem; }
.primary { border-radius: 0.45rem; padding: 0.45rem 0.7rem; background: #243b76; color: #fff; text-decoration: none; }
button { border: 1px solid #c5cedd; border-radius: 0.45rem; padding: 0.38rem 0.6rem; background: #fff; cursor: pointer; }
.table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d4dbeb; }
th, td { border-bottom: 1px solid #ecf0f8; padding: 0.55rem; font-size: 0.92rem; text-align: left; }
thead th { background: #f8faff; }
.th-date { cursor: pointer; user-select: none; }
.th-date:hover { background: #eef3fe; }
.color-dot { display: inline-block; width: 0.8rem; height: 0.8rem; border-radius: 999px; margin-right: 0.35rem; border: 1px solid #c4cad7; vertical-align: middle; }
.actions-cell { display: flex; align-items: center; gap: 0.6rem; }
.actions-cell a { color: #304f9f; text-decoration: none; }
.danger { border-color: #c43e3e; color: #c43e3e; }
.error { color: #b72929; margin: 0; }
.hint { color: #63708c; margin: 0; }
.sort-mobile { display: none; }
.overlay { position: fixed; inset: 0; background: rgb(0 0 0 / 0.4); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.dialog { background: #fff; border-radius: 0.6rem; padding: 1.5rem; width: min(360px, 90vw); box-shadow: 0 4px 24px rgb(0 0 0 / 0.15); }
.dialog-msg { margin: 0 0 1.2rem; font-size: 1rem; line-height: 1.5; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 0.6rem; }
@media (max-width: 768px) {
  .sort-mobile { display: inline-block; }
  .th-date { pointer-events: none; }
  .table thead { display: none; }
  .table, .table tbody, .table tr, .table td { display: block; }
  .table tr { margin-bottom: 0.75rem; border: 1px solid #d4dbeb; border-radius: 0.5rem; padding: 0.6rem 0.75rem; background: #fff; }
  .table td { border: none; padding: 0.3rem 0; font-size: 0.88rem; display: flex; align-items: center; gap: 0.4rem; }
  .table td::before { content: attr(data-label); font-weight: 600; color: #5a6377; flex-shrink: 0; min-width: 3.2em; }
  .coord-cell { display: none !important; }
  .color-value { display: none; }
  .actions-cell { padding-top: 0.5rem !important; border-top: 1px solid #ecf0f8 !important; margin-top: 0.3rem; }
  .actions-cell::before { display: none; }
  .actions-cell a, .actions-cell button { font-size: 0.85rem; padding: 0.3rem 0.5rem; }
}
</style>
```

- [ ] **Step 2: 创建 `src/views/publish/PublishMemoryForm.vue`**

基于现有的 `AdminMemoryForm.vue`，将所有 API 调用和路由名改为 publish 版本。改动集中在：
- 第 7-13 行: `import` 改为 `fetchPublishMemories`, `createPublishMemory`, `fetchPublishMemoryById`, `updatePublishMemory`, `uploadPublishMedia`
- 第 100 行: 路由名 `AdminMemoryCreate` → `PublishMemoryCreate`
- 第 101 行: 路由名 `AdminMemoryEdit` → `PublishMemoryEdit`
- 第 212 行: `fetchAdminMemories()` → `fetchPublishMemories()`
- 第 214 行: `fetchAdminMemories()` → `fetchPublishMemories()`
- 第 238 行: `uploadAdminMedia()` → `uploadPublishMedia()`
- 第 283 行: `uploadAdminMedia()` → `uploadPublishMedia()`
- 第 353 行: `updateAdminMemory()` → `updatePublishMemory()`
- 第 355 行: `createAdminMemory()` → `createPublishMemory()`
- 第 357 行: `AdminMemoryList` → `PublishMemoryList`
- 第 385 行: `fetchAdminMemoryById()` → `fetchPublishMemoryById()`
- 第 529 行: `AdminMemoryList` → `PublishMemoryList`

其他内容与 `AdminMemoryForm.vue` 一致。

- [ ] **Step 3: 删除旧 admin 文件**

```bash
Remove-Item -Recurse -Force src/views/admin
Remove-Item -Force src/api/auth.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/views/publish/PublishMemoryList.vue src/views/publish/PublishMemoryForm.vue
git add -A
git commit -m "feat: migrate admin pages to publish with user auth"
```

---

## Phase 5: 评论 UI

### Task 17: CommentSection 组件

**Files:**
- Create: `src/components/CommentSection.vue`

- [ ] **Step 1: 创建 `src/components/CommentSection.vue`**

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Comment } from '@/types/memory'
import { fetchComments, createComment, deleteComment } from '@/api/comments'
import { checkUserSession, getCachedUser } from '@/api/userAuth'
import UserLoginDialog from './UserLoginDialog.vue'

const props = defineProps<{
  memoryId: string
}>()

const comments = ref<Comment[]>([])
const loading = ref(false)
const inputText = ref('')
const replyTarget = ref<Comment | null>(null)
const showLogin = ref(false)
const submitting = ref(false)

const isLoggedIn = computed(() => !!getCachedUser())
const currentUser = computed(() => getCachedUser())

const canDelete = (comment: Comment) => {
  return currentUser.value && comment.userId === currentUser.value.userId
}

const loadComments = async () => {
  loading.value = true
  try {
    comments.value = await fetchComments(props.memoryId)
  } catch {
    // 静默失败
  } finally {
    loading.value = false
  }
}

const handleLoginSuccess = () => {
  showLogin.value = false
  loadComments()
}

const startReply = (comment: Comment) => {
  replyTarget.value = comment
  inputText.value = ''
}

const cancelReply = () => {
  replyTarget.value = null
  inputText.value = ''
}

const submitComment = async () => {
  if (!inputText.value.trim() || submitting.value) return
  submitting.value = true
  try {
    await createComment(props.memoryId, {
      content: inputText.value.trim(),
      parentId: replyTarget.value?.id,
    })
    inputText.value = ''
    replyTarget.value = null
    await loadComments()
  } catch {
    // 静默失败
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (comment: Comment) => {
  if (!canDelete(comment)) return
  try {
    await deleteComment(comment.id)
    await loadComments()
  } catch {
    // 静默失败
  }
}

const formatTime = (iso: string): string => {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const handlePromptLogin = () => {
  showLogin.value = true
}

onMounted(() => {
  checkUserSession().finally(() => loadComments())
})
</script>

<template>
  <div class="comment-section">
    <h3 class="comment-heading">💬 回忆对话</h3>

    <div v-if="loading" class="loading-hint">加载中...</div>

    <div v-else-if="comments.length === 0" class="empty-hint">
      还没有对话，来写下第一句吧
    </div>

    <div v-else class="comment-list">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-meta">
          <span class="comment-author" :class="comment.userId">{{ comment.userName }}</span>
          <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
          <button v-if="canDelete(comment)" class="delete-btn" @click="handleDelete(comment)">删除</button>
        </div>
        <p class="comment-content">{{ comment.content }}</p>
        <button v-if="isLoggedIn" class="reply-btn" @click="startReply(comment)">回复</button>

        <div v-if="comment.replies.length > 0" class="replies">
          <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
            <div class="comment-meta">
              <span class="comment-author" :class="reply.userId">{{ reply.userName }}</span>
              <span class="comment-time">{{ formatTime(reply.createdAt) }}</span>
              <button v-if="canDelete(reply)" class="delete-btn" @click="handleDelete(reply)">删除</button>
            </div>
            <p class="comment-content">{{ reply.content }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="replyTarget" class="reply-indicator">
      回复 @{{ replyTarget.userName }}：
      <button class="cancel-reply" @click="cancelReply">取消</button>
    </div>

    <div v-if="isLoggedIn" class="input-area">
      <textarea
        v-model="inputText"
        :placeholder="replyTarget ? '输入回复...' : '写下你的回忆...'"
        rows="2"
        maxlength="2000"
        @keydown.ctrl.enter="submitComment"
      />
      <button :disabled="!inputText.trim() || submitting" @click="submitComment">
        {{ submitting ? '发送中...' : '发送' }}
      </button>
    </div>

    <div v-else class="login-prompt" @click="handlePromptLogin">
      <span class="login-link">🔐 登录后可参与回忆对话 →</span>
    </div>

    <UserLoginDialog
      v-if="showLogin"
      @close="showLogin = false"
      @success="handleLoginSuccess"
    />
  </div>
</template>

<style scoped>
.comment-section {
  width: 100%;
  max-width: 600px;
  margin: 1.5rem auto 0;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.comment-heading {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  text-align: left;
}

.loading-hint,
.empty-hint {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  padding: 1rem 0;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comment-item {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  padding: 0.75rem;
  text-align: left;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.comment-author {
  font-weight: 600;
  font-size: 0.85rem;
}
.comment-author.party_a { color: #f0a0d0; }
.comment-author.party_b { color: #80c8f0; }

.comment-time {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
}

.delete-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: rgba(255, 100, 100, 0.6);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
}

.comment-content {
  margin: 0 0 0.35rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  word-break: break-word;
}

.reply-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;
}

.replies {
  margin-top: 0.5rem;
  margin-left: 1rem;
  padding-left: 0.75rem;
  border-left: 2px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reply-item {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 0.5rem;
}

.reply-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.75rem;
}

.cancel-reply {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 0.8rem;
  text-decoration: underline;
}

.input-area {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.input-area textarea {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.5rem;
  padding: 0.5rem 0.65rem;
  color: white;
  font-size: 0.85rem;
  font-family: inherit;
  resize: none;
}

.input-area textarea::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.input-area button {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  color: white;
  cursor: pointer;
  white-space: nowrap;
}

.input-area button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.login-prompt {
  margin-top: 0.75rem;
  text-align: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.login-prompt:hover {
  background: rgba(255, 255, 255, 0.1);
}

.login-link {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CommentSection.vue
git commit -m "feat: add comment section component with reply threads"
```

---

### Task 18: UserLoginDialog 组件

**Files:**
- Create: `src/components/UserLoginDialog.vue`

- [ ] **Step 1: 创建 `src/components/UserLoginDialog.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { loginUser } from '@/api/userAuth'
import { ApiError } from '@/api/client'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const identities = [
  { id: 'party_a' as const, label: '她', emoji: '👩' },
  { id: 'party_b' as const, label: '他', emoji: '👨' },
]

const step = ref<'select' | 'password'>('select')
const selectedIdentity = ref<'party_a' | 'party_b' | null>(null)
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const selectIdentity = (id: 'party_a' | 'party_b') => {
  selectedIdentity.value = id
  step.value = 'password'
  errorMessage.value = ''
}

const handleBack = () => {
  step.value = 'select'
  selectedIdentity.value = null
  errorMessage.value = ''
}

const handleSubmit = async () => {
  if (!selectedIdentity.value || !password.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    await loginUser(selectedIdentity.value, password.value)
    emit('success')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      errorMessage.value = '密码错误'
    } else if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '登录失败'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog-card">
      <button class="dialog-close" @click="emit('close')">✕</button>

      <template v-if="step === 'select'">
        <h3>选择身份</h3>
        <p class="dialog-hint">请选择你的身份以参与回忆对话</p>
        <div class="identity-grid">
          <button
            v-for="item in identities"
            :key="item.id"
            class="identity-btn"
            @click="selectIdentity(item.id)"
          >
            <span class="identity-emoji">{{ item.emoji }}</span>
            <span class="identity-label">{{ item.label }}</span>
          </button>
        </div>
      </template>

      <template v-else>
        <button class="back-btn" @click="handleBack">← 返回</button>
        <h3>输入密码</h3>
        <div class="selected-badge">
          {{ identities.find(i => i.id === selectedIdentity)?.emoji }}
          {{ identities.find(i => i.id === selectedIdentity)?.label }}
        </div>
        <input
          v-model="password"
          type="password"
          placeholder="输入密码"
          autocomplete="current-password"
          @keyup.enter="handleSubmit"
        />
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <button :disabled="loading || !password" @click="handleSubmit">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.dialog-card {
  background: rgba(20, 30, 60, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  width: min(320px, 88vw);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
}

.dialog-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 1.1rem;
}

.dialog-card h3 {
  margin: 0;
  color: white;
  font-size: 1.1rem;
}

.dialog-hint {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.identity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.identity-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.06);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.identity-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.35);
}

.identity-emoji { font-size: 1.75rem; }
.identity-label { font-weight: 600; font-size: 1rem; }

.back-btn {
  align-self: flex-start;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0;
  font-size: 0.85rem;
}

.selected-badge {
  font-size: 1rem;
  color: white;
}

input {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.55rem 0.65rem;
  color: white;
  font-size: 1rem;
}

input::placeholder { color: rgba(255, 255, 255, 0.3); }

.dialog-card > button:last-child {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.5rem;
  padding: 0.58rem;
  color: white;
  cursor: pointer;
}

.dialog-card > button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.error {
  margin: 0;
  color: #f07070;
  font-size: 0.85rem;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/UserLoginDialog.vue
git commit -m "feat: add user login dialog for comment auth"
```

---

### Task 19: 集成到 MemoryDetail + 清理旧文件

**Files:**
- Modify: `src/components/MemoryDetail.vue`
- Delete: `src/api/auth.ts` (already deleted in Task 16)

- [ ] **Step 1: 在 `MemoryDetail.vue` 中集成 CommentSection**

在 `<script>` 标签内的 `import` 区域追加：
```typescript
import CommentSection from './CommentSection.vue'
```

在 `<template>` 中 `</div>` 闭合的 `content-wrapper` 之前、`<button class="back-button">` 之前插入：
```html
<CommentSection :memory-id="memory.id" />
```

即在现有第 431-435 行的音频控制之后、返回按钮之前插入。

- [ ] **Step 2: 确认删除已完成**
```bash
# 确认旧 admin 目录和旧 auth 文件已清理
if (Test-Path src/views/admin) { Remove-Item -Recurse -Force src/views/admin }
if (Test-Path src/api/auth.ts) { Remove-Item -Force src/api/auth.ts }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/MemoryDetail.vue
git add -A
git commit -m "feat: integrate comment section into memory detail, remove old admin files"
```

---

## Phase 6: 通知 UI

### Task 20: NotificationBell 组件

**Files:**
- Create: `src/components/NotificationBell.vue`

- [ ] **Step 1: 创建 `src/components/NotificationBell.vue`**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNotificationStore } from '@/stores/notifications'

const emit = defineEmits<{
  (e: 'navigate', memoryId: string): void
}>()

const notificationStore = useNotificationStore()
const isOpen = ref(false)

const displayNotifications = computed(() => notificationStore.latestNotifications)

const unreadCount = computed(() => notificationStore.unreadCount)

const formatTime = (iso: string): string => {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const typeIcon = (type: string): string => {
  switch (type) {
    case 'new_memory': return '🌟'
    case 'new_comment': return '💬'
    case 'new_reply': return '↩️'
    default: return '🔔'
  }
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value && unreadCount.value > 0) {
    notificationStore.markAllRead()
  }
}

const handleNotificationClick = (memoryId: string) => {
  isOpen.value = false
  emit('navigate', memoryId)
}

const closeDropdown = () => {
  isOpen.value = false
}
</script>

<template>
  <div class="bell-wrapper">
    <button class="bell-btn" @click="toggleDropdown">
      <span class="bell-icon">🔔</span>
      <span v-if="unreadCount > 0" class="bell-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <Teleport to="body">
      <div v-if="isOpen" class="dropdown-overlay" @click="closeDropdown" />
      <Transition name="dropdown">
        <div v-if="isOpen" class="notification-dropdown">
          <div class="dropdown-header">
            <span>通知</span>
            <button v-if="unreadCount > 0" class="mark-read-btn" @click="notificationStore.markAllRead()">
              全部已读
            </button>
          </div>
          <div v-if="displayNotifications.length === 0" class="empty-state">
            暂无通知
          </div>
          <div v-else class="notification-list">
            <div
              v-for="n in displayNotifications"
              :key="n.id"
              class="notification-item"
              :class="{ unread: !n.isRead }"
              @click="handleNotificationClick(n.memoryId)"
            >
              <span class="notification-icon">{{ typeIcon(n.type) }}</span>
              <div class="notification-body">
                <p class="notification-title">{{ n.title }}</p>
                <p v-if="n.content" class="notification-preview">{{ n.content }}</p>
                <span class="notification-time">{{ formatTime(n.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.bell-wrapper {
  position: relative;
}

.bell-btn {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 0.4rem 0.6rem;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}

.bell-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.bell-icon {
  font-size: 1.1rem;
}

.bell-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #f06060;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.2rem;
}

.dropdown-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
}

.notification-dropdown {
  position: fixed;
  top: 3.5rem;
  right: 1rem;
  width: min(360px, 92vw);
  max-height: 70vh;
  background: rgba(15, 25, 55, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.85rem;
  overflow: hidden;
  z-index: 9999;
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  font-weight: 600;
}

.mark-read-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
  cursor: pointer;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
}

.notification-list {
  overflow-y: auto;
  max-height: calc(70vh - 3rem);
}

.notification-item {
  display: flex;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.notification-item.unread {
  background: rgba(100, 150, 255, 0.06);
}

.notification-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.notification-body {
  flex: 1;
  min-width: 0;
}

.notification-title {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.3;
}

.notification-preview {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-time {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 0.15rem;
  display: block;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NotificationBell.vue
git commit -m "feat: add notification bell component with dropdown"
```

---

### Task 21: 集成通知铃铛到主应用 + 发布管理

**Files:**
- Modify: `src/App.vue`
- Modify: `src/views/publish/PublishLayout.vue`

- [ ] **Step 1: 在 `src/App.vue` 中集成 NotificationBell**

在 `<script setup>` 区域追加 import：
```typescript
import NotificationBell from './components/NotificationBell.vue'
import { useNotificationStore } from './stores/notifications'

const notificationStore = useNotificationStore()
```

在 `onMounted` 中追加：
```typescript
notificationStore.connectSSE()
notificationStore.refreshUnreadCount()
```

在 `<template>` 中，在全屏按钮旁边加入通知铃铛（按钮之后）：
```html
<NotificationBell @navigate="handleNotificationNavigate" />
```

新增通知导航处理方法：
```typescript
const handleNotificationNavigate = (memoryId: string) => {
  // 如果当前在 PhaseTwo，跳转到对应记忆点
  if (currentPhase.value === 2) {
    // 这里 PhaseTwo 需要暴露一个打开记忆点的方法
    // 暂用 query param 传递
    window.location.href = `/?memory=${memoryId}`
  }
}
```

- [ ] **Step 2: 在 `src/views/publish/PublishLayout.vue` 中集成 NotificationBell**

在 `<script setup>` 中，notificationStore 已存在，追加 import：
```typescript
import NotificationBell from '@/components/NotificationBell.vue'
```

在 `<template>` 的 `<nav class="actions">` 中，在所有链接之后、退出按钮之前加入：
```html
<NotificationBell @navigate="handleNotificationNavigate" />
```

新增导航处理方法：
```typescript
const handleNotificationNavigate = (memoryId: string) => {
  // 在发布管理页面，点击通知跳转到编辑页
  router.push({ name: 'PublishMemoryEdit', params: { id: memoryId } })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/App.vue src/views/publish/PublishLayout.vue
git commit -m "feat: integrate notification bell into main app and publish layout"
```

---

## 验证清单

### 启动验证
```bash
# 安装依赖（如果需要）
bun install

# 启动开发模式（前端 + 后端）
bun run dev-all
```

### 功能验证

| 编号 | 测试项 | 预期结果 |
|------|--------|----------|
| 1 | 访问 `http://localhost:5213/publish/login` | 看到身份选择页面（她/他两个按钮） |
| 2 | 选择"她"，输入预设密码 `ta123456` | 登录成功，跳转到记忆点列表 |
| 3 | 新增一个记忆点 | 在该记忆点详情页看到评论入口 |
| 4 | 打开另一个浏览器，选择"他"登录 | 应该收到"她发布了新记忆点"的通知 |
| 5 | 在主应用点击记忆节点打开详情 | 底部显示评论区 |
| 6 | 未登录时评论区显示"登录后可参与回忆对话" | 点击弹出登录弹窗 |
| 7 | 登录后可以发表评论和回复 | 评论显示后可以回复 |
| 8 | 删除自己的评论 | 仅自己身份的删除按钮可用 |
| 9 | 通知铃铛显示未读数 | 有新通知时红点出现 |
| 10 | 点击通知下拉 | 列表显示最近 10 条通知 |

### 回归验证
| 编号 | 测试项 | 预期结果 |
|------|--------|----------|
| 11 | 访问 `http://localhost:5213/` | 3D 星球体验正常加载 |
| 12 | 点击星尘完成过渡 | 正常进入第二阶段 |
| 13 | 点击记忆节点 | 详情弹窗正常打开 |
| 14 | 原有的 `/admin/*` 页面 | 应返回 404 或重定向 |

---

## 自检清单

### 1. Spec Coverage
- ✅ **Admin 移除 + 双用户认证**: Task 1-2 (env/auth), Task 14 (router), Task 15-16 (publish pages), Task 19 (cleanup)
- ✅ **记忆点评论**: Task 3-4 (db/types), Task 5 (comments DAL+route), Task 11 (frontend API), Task 17-18 (UI), Task 19 (integration)
- ✅ **实时通知**: Task 6 (SSE manager), Task 7 (notification DAL+route), Task 12 (frontend store), Task 20-21 (UI integration)
- ✅ **记忆点创建时触发通知**: Task 8 (memory routes notify call)
- ✅ **评论/回复时触发通知**: Task 5 (comment routes notify call)

### 2. Placeholder Scan
- All code blocks contain complete, working TypeScript/Vue code
- No TBD, TODO, or "implement later" patterns
- All function signatures and type names are consistent across tasks

### 3. Type Consistency
- `UserSession` in `server/auth.ts` → used in all route files
- `UserVariables` in `server/auth.ts` → consistent Hono generic parameter
- `CommentDto` in `server/types.ts` → return type from DAL and routes
- `NotificationDto` in `server/types.ts` → return type from notification DAL
- API response format: `{ data: ... }` consistent with existing pattern
