# 任务计划：记忆点评论 + 通知系统

## 目标
在记忆点详情页添加双方评论功能，去掉 admin 体系改为双用户账号登录，实现实时通知推送。

## 当前阶段
阶段 12

## 技术栈
- 前端：Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS v4 + shadcn-vue
- 后端：Bun + Hono + SQLite (bun:sqlite)
- 实时：SSE (Server-Sent Events)

## 关键决策
| 决策 | 理由 |
|------|------|
| 去掉 admin，改为双用户账号 | 用户已有自己的账号，admin 概念多余 |
| `/admin` → `/publish` | 管理入口改名，与用户体系一致 |
| `/api/admin/*` → `/api/publish/*` | 后端 API 路径同步更新 |
| 评论存储在 SQLite | 持久化，不依赖 localStorage |
| 双用户凭据存 `.env` | 与现有 `ADMIN_PASSWORD` 模式一致，无需用户表 |
| Session cookie 内嵌 userId | 区分两个用户，cookie name 用 `love_user_session` |
| SSE 实现实时通知 | Bun/Hono 原生支持，轻量无需额外依赖 |
| 评论支持二级嵌套 | 顶层评论 + 直接回复，够用且简单 |

## 各阶段

### 阶段 1：环境变量与配置重构
- [x] `.env` 删除 `ADMIN_PASSWORD`，新增 `PARTY_A_NAME`、`PARTY_A_PASSWORD`、`PARTY_B_NAME`、`PARTY_B_PASSWORD`、`USER_SESSION_COOKIE_NAME`
- [x] `server/config.ts` 替换 admin 配置校验为用户配置校验，新增 `userAccounts`、`findUserByCredentials()`、`findUserById()`、`getOtherUserId()`
- **状态：** complete

### 阶段 2：数据库变更
- [x] `server/db.ts` 追加 `comments` 表建表语句（含 memory_id、parent_id、user_id、user_name、content）
- [x] `server/db.ts` 追加 `notifications` 表建表语句（含 user_id、type、title、content、memory_id、comment_id、actor_id、actor_name、is_read）
- [ ] 验证建表正确（启动服务器检查）
- **状态：** in_progress

### 阶段 3：后端认证重构
- [x] `server/auth.ts` 移除所有 admin 相关代码
- [x] `server/auth.ts` 新增 `UserSession` 类型、`createUserSession()`、`clearUserSession()`、`getUserSession()`、`requireUserAuth` 中间件
- [x] `server/types.ts` 新增 `createCommentInputSchema`、`CommentDto`、`CommentRow` 类型
- [x] `server/types.ts` 新增通知相关类型 `NotificationType`、`NotificationRow`、`NotificationDto`
- **状态：** complete

### 阶段 4：后端评论系统
- [x] 新建 `server/comments.ts` — 数据访问层：`listCommentsByMemoryId()`、`createComment()`、`deleteComment()`
- [x] 新建 `server/routes/comments.ts` — 路由：GET/POST comments, DELETE comment，含通知推送
- [x] `server/index.ts` 挂载评论路由
- **状态：** complete

### 阶段 5：后端通知系统 (SSE)
- [x] 新建 `server/sse.ts` — SSE 连接管理器 + pub/sub
- [x] 新建 `server/notifications.ts` — 通知 DAL
- [x] 新建 `server/routes/notifications.ts` — 通知路由（SSE 流、列表、未读数、标记已读）
- [x] `server/routes/memories.ts` — createMemory 成功后调用 `createAndNotify()`
- [x] `server/routes/comments.ts` — createComment 成功后根据 parentId 判断推送给谁
- [x] `server/index.ts` 挂载通知路由
- **状态：** complete

### 阶段 6：后端管理路由改造
- [x] `server/routes/memories.ts` — `/api/admin/memories` → `/api/publish/memories`，`requireAuth` → `requireUserAuth`
- [x] `server/routes/upload.ts` — `/api/admin/upload` → `/api/publish/upload`，`requireAuth` → `requireUserAuth`
- [x] `server/routes/auth.ts` — 重写为用户认证路由，新增 `/api/auth/user/options`、`/login`、`/logout`、`/me`
- [x] `server/index.ts` — 更新路由挂载
- **状态：** complete

### 阶段 7：前端类型与 API 层
- [x] `src/types/memory.ts` — 新增 `Comment` 接口、`AppNotification` 接口
- [x] 新建 `src/api/userAuth.ts` — `userLogin()`、`userLogout()`、`checkUserSession()`、`getUserOptions()`
- [x] 新建 `src/api/comments.ts` — `fetchComments()`、`createComment()`、`deleteComment()`
- [x] 新建 `src/api/notifications.ts` — `fetchNotifications()`、`fetchUnreadCount()`、`markAllNotificationsRead()`
- [x] `src/api/memories.ts` — `fetchAdmin*` → `fetchPublish*`，API 路径改为 `/api/publish/memories`
- [x] 删除 `src/api/auth.ts`
- **状态：** complete

### 阶段 8：前端通知 Store
- [x] 新建 `src/stores/notifications.ts` — Pinia store：SSE 连接管理 + 未读数 + 通知列表
- **状态：** complete

### 阶段 9：前端发布管理页面
- [x] 新建 `src/views/publish/PublishLogin.vue` — 身份选择 + 密码登录
- [x] 新建 `src/views/publish/PublishLayout.vue` — 布局骨架 + 通知铃铛
- [x] 新建 `src/views/publish/PublishMemoryList.vue` — 记忆点列表
- [x] 新建 `src/views/publish/PublishMemoryForm.vue` — 新增/编辑表单
- [x] `src/router/index.ts` — 替换路由表和导航守卫
- [x] `src/App.vue` — `isAdminRoute` → `isPublishRoute`
- [x] 删除 `src/views/admin/` 目录
- **状态：** complete

### 阶段 10：前端评论组件
- [x] 新建 `src/components/CommentSection.vue` — 评论列表 + 输入框 + 回复
- [x] 新建 `src/components/UserLoginDialog.vue` — 登录弹窗
- [x] `src/components/MemoryDetail.vue` — 底部集成 `CommentSection`
- **状态：** complete

### 阶段 11：前端通知组件
- [x] 新建 `src/components/NotificationBell.vue` — 铃铛 + 红点 + 下拉列表
- [x] `src/App.vue` — PhaseTwo 区域加入 `<NotificationBell />`
- **状态：** complete

### 阶段 12：验证与测试
- [x] 后端启动验证通过
- [x] `/api/health` — 健康检查 ✓
- [x] `/api/auth/user/options` — 获取用户列表 ✓
- [x] `/api/auth/user/login` — 用户登录 ✓
- [x] `/api/publish/memories` — 创建记忆点 ✓
- [x] `/api/memories/:id/comments` — 创建/获取评论 ✓
- **状态：** complete

## 文件变更总表

### 新建（19 个文件）
```
server/
  comments.ts
  notifications.ts
  sse.ts
  routes/comments.ts
  routes/notifications.ts
src/
  api/comments.ts
  api/userAuth.ts
  api/notifications.ts
  stores/notifications.ts
  components/CommentSection.vue
  components/UserLoginDialog.vue
  components/NotificationBell.vue
  views/publish/PublishLogin.vue
  views/publish/PublishLayout.vue
  views/publish/PublishMemoryList.vue
  views/publish/PublishMemoryForm.vue
```

### 修改（13 个文件）
```
.env
server/config.ts
server/db.ts
server/auth.ts
server/types.ts
server/index.ts
server/routes/memories.ts
server/routes/upload.ts
src/router/index.ts
src/App.vue
src/types/memory.ts
src/api/memories.ts
src/components/MemoryDetail.vue
```

### 删除
```
src/api/auth.ts
src/views/admin/   (整个目录)
```

## 遇到的错误
| 错误 | 尝试次数 | 解决方案 |
|------|---------|---------|
|      |         |         |

## 备注
- 随着进度更新阶段状态：pending → in_progress → complete
- 做重大决策前重新读取此计划
- 记录所有错误，避免重复
- 阶段 1-6 为后端，7-11 为前端，12 为验证
