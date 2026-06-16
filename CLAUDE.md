## 架构

### 三阶段体验

应用核心是一个基于状态机的三阶段流程，在 `App.vue` 中通过 `currentPhase`（1/2/3）控制：

1. **PhaseOne**（`PhaseOne.vue`）— 星尘宇宙，长按点燃
2. **PhaseTwo**（`PhaseTwo.vue`）— 3D 记忆星球（`MemoryPlanet.vue`），点击节点查看记忆详情（`MemoryDetail.vue`），评论功能（`CommentSection.vue` + `CommentNode.vue`）
3. **PhaseThree**（`PhaseThree.vue`）— 画心动画、照片展示、信封、3D 玫瑰绽放

### 数据模型

记忆存储在 SQLite 中，使用球坐标（`theta`、`phi`）在 3D 星球上定位。每条记忆包含 `type`（photo/date/chat/location/music）、`particleTheme`（ocean/forest/city/night/fireworks 等）以及富文本内容（文字、图片、音频、视频）。评论支持嵌套回复，通过 `parentId` 关联。

### 双用户认证

专为两个人设计（`.env` 中的 "PARTY_A" / "PARTY_B"）。使用密码认证 + 签名 Cookie 会话。

### 目录结构

```
src/
├── App.vue              # 阶段调度器，全屏布局
├── components/          # PhaseOne, PhaseTwo, PhaseThree, MemoryPlanet,
│                        # MemoryDetail, FloatingMusicPlayer, CommentSection 等
├── api/                 # fetch 封装：client.ts, comments.ts, memories.ts 等
├── stores/              # Pinia 状态管理：musicPlayer, notifications（基于 SSE）
├── router/index.ts      # 路由：/login, /publish/*
├── views/publish/       # 后台管理：PublishMemoryForm, PublishMemoryList 等
├── types/memory.ts      # TypeScript 类型定义
├── styles/globals.css   # Tailwind v4 主题变量、shadcn-vue 样式
├── data/memories.ts     # 静态种子数据
server/
├── index.ts             # Hono 入口、路由
├── seed.ts              # 数据库种子脚本
├── db.ts, auth.ts, ...  # 各模块
```

### 编码规范

- **CSS：** 优先使用 Tailwind 工具类；`cn()` 工具函数（clsx + tailwind-merge）处理条件样式

- **避免重复制造轮子：**优先使用成熟稳定的三方库

- **移动端兼容**：重点适配 iPhone 屏幕及安全区域

  
