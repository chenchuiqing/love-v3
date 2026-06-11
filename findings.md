# 发现与决策

## 需求
- 用户点击通知时，跳转到对应记忆点页面
- 定位到相关评论位置（如果通知是关于评论的）
- 支持不同通知类型：新记忆点、新评论、新回复

## 研究发现
### 当前通知系统
- 通知存储在 notifications 表，包含 memoryId, commentId, type 等字段
- 前端使用 UserProfileDropdown.vue 显示通知列表
- 当前通知项（upd-notif-item）没有点击事件处理
- 通知数据结构：AppNotification 包含 memoryId, commentId, type 等字段

### 路由系统
- 当前路由配置中没有独立的记忆点详情页路由
- 主页（/）使用 PhaseTwo.vue 组件
- PhaseTwo.vue 包含 MemoryPlanet（3D星球）和 MemoryDetail（记忆点详情）
- 记忆点详情通过 activeMemory 状态控制显示

### 评论系统
- 评论存储在 comments 表，有 parent_id 支持嵌套
- 前端 CommentSection.vue 组件展示评论
- MemoryDetail.vue 底部嵌入了 CommentSection 组件（第433行）
- 评论项使用 comment-item 类名，每个评论有 id 属性

### 架构特点
- 主页（/）使用 PhaseTwo.vue 组件
- PhaseTwo.vue 通过 activeMemory 状态控制 MemoryDetail 的显示
- MemoryDetail 是一个组件，不是独立路由页面
- 需要通过 URL 参数或全局状态来传递要查看的记忆点 ID

## 技术决策
| 决策 | 理由 |
|------|------|
|      |      |

## 遇到的问题
| 问题 | 解决方案 |
|------|---------|
|      |         |

## 资源
- 通知数据结构：server/types.ts 中的 NotificationDto
- 前端通知类型：src/types/memory.ts 中的 AppNotification
- 通知组件：src/components/UserProfileDropdown.vue

## 视觉/浏览器发现
<!-- 关键：每执行2次查看/浏览器操作后必须更新此部分 -->
<!-- 多模态内容必须立即以文本形式记录 -->
-

---
*每执行2次查看/浏览器/搜索操作后更新此文件*
*防止视觉信息丢失*