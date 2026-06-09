# 发现与决策

## 项目概览
- **项目名称：** infule-official-v2 (love-v3)
- **本质：** 3D 粒子互动的表白/纪念礼物页面，以"记忆星球"为核心概念
- **三阶段叙事：** 星尘环绕 → 记忆星球 → 粒子叙事四幕
- **包管理：** Bun 1.3.4

## 技术栈发现
| 层 | 技术 | 备注 |
|----|------|------|
| 前端框架 | Vue 3 + TypeScript | Composition API + `<script setup>` |
| 构建工具 | Vite 7.1 | 含 @ 别名、代理 /api → :3000 |
| 状态管理 | Pinia 3.0 | 目前仅 musicPlayer store |
| 3D 渲染 | Three.js 0.184 | 粒子系统、星球、玫瑰模型 |
| 动画 | GSAP 3.15 + motion-v 2.2 | 高级补间 + AnimatePresence |
| UI 库 | reka-ui / shadcn-vue 2.7 | AppleCardCarousel 等 |
| 样式 | Tailwind CSS 4.1 | 自定义 globals.css |
| 后端框架 | Hono | 轻量 Web 框架 |
| 数据库 | Bun:sqlite | 嵌入式，文件级 |
| ID 生成 | @sapphire/snowflake | Snowflake 算法 |
| 校验 | zod 4.4 | 前后端共享 schema |

## 现有认证机制
- Admin 单密码认证，密码从 `.env` 的 `ADMIN_PASSWORD` 读取
- Session cookie 签名机制：`hono/cookie` 的 `setSignedCookie` / `getSignedCookie`
- Session payload：`{ sid: string, iat: number }` 编码为 base64url
- Cookie name：`love_admin_session`（来自 `.env` 的 `SESSION_COOKIE_NAME`）
- 签名密钥：`SESSION_SECRET`（≥32 字符）
- 过期时间：7 天（604800 秒）
- 中间件 `requireAuth` 校验 cookie 并注入 `adminSession` 到 context

## 现有数据库结构
```sql
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,           -- 'photo'|'date'|'chat'|'location'|'music'
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  color TEXT NOT NULL,          -- #RRGGBB
  theta REAL NOT NULL,          -- 球面方位角
  phi REAL NOT NULL,            -- 球面极角
  orbit_radius REAL NOT NULL,   -- 轨道半径倍数
  content TEXT NOT NULL,        -- JSON: MemoryContent
  sort_order INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 现有 API 路由
| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/api/memories` | 公开 | 获取所有记忆点 |
| GET | `/api/admin/memories` | admin | 管理端列表 |
| GET | `/api/admin/memories/:id` | admin | 单条详情 |
| POST | `/api/admin/memories` | admin | 创建 |
| PUT | `/api/admin/memories/:id` | admin | 更新 |
| DELETE | `/api/admin/memories/:id` | admin | 删除 |
| POST | `/api/admin/upload` | admin | 文件上传 |
| POST | `/api/auth/login` | 公开 | admin 登录 |
| POST | `/api/auth/logout` | 公开 | admin 登出 |
| GET | `/api/auth/me` | admin | 验证会话 |

## 现有前端路由
| 路径 | 组件 | 守卫 |
|------|------|------|
| `/` | Home.vue（实际由 App.vue 控制三阶段） | 无 |
| `/admin/login` | AdminLogin.vue | guestOnly |
| `/admin` | AdminLayout.vue | requiresAdminAuth |
| `/admin/memories` | AdminMemoryList.vue | requiresAdminAuth |
| `/admin/memories/new` | AdminMemoryForm.vue | requiresAdminAuth |
| `/admin/memories/:id/edit` | AdminMemoryForm.vue | requiresAdminAuth |

## MemoryDetail.vue 分析
- 固定全屏覆盖层 (`position: fixed; inset: 0; z-index: 50`)
- Three.js 粒子背景（8000 粒子，主题配色）
- 内容区：日期徽章 → 标题 → 媒体展示（单图/轮播） → 打字机文字 → 位置标签 → 音频控制 → 返回按钮
- `content-wrapper` 是滚动容器（`overflow-y: auto`）
- 评论区应插入在返回按钮之前

## App.vue 分析
- `isAdminRoute` 判断路径前缀 `/admin`
- admin 路由直接渲染 `<RouterView>`
- 非 admin 路由渲染三阶段体验
- `applyScrollModeByRoute()` 切换滚动模式
- 通知铃铛应放在 PhaseTwo 视图内（不干扰 Phase1/3 的沉浸体验）

## 文件上传机制
- `server/routes/upload.ts`：POST `/api/admin/upload`
- 接受 FormData（字段名 `file`）
- 支持图片、视频、mp3
- 最大 100MB
- 存储到 `uploads/memories/` 目录
- 返回 `{ url, name, size, type }`

## API 请求封装
- `src/api/client.ts`：`apiRequest<T>()` 函数
- 自动 `credentials: 'include'`、`Content-Type: application/json`
- 统一错误处理：`ApiError` 类（含 HTTP status）
- 响应格式：`{ data: ... }` 或 `{ message: ... }`

## 需求确认
| 需求 | 状态 |
|------|------|
| 记忆点详情页添加评论功能 | 已确认 |
| 双方可以相互评论 | 已确认 |
| 需要登录（不存 localStorage） | 已确认 |
| 数据持久化保存（SQLite） | 已确认 |
| 去掉 admin，改为 /publish | 已确认 |
| 对方发布/评论后通知另一方 | 已确认 |

---
*最后更新：2026-06-09*
