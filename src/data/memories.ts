import type { Memory } from '@/types/memory'

/**
 * 如何编写「记忆点」数据（每项对应星球上的一个 Sprite 节点 + 点击进入详情的内容）
 *
 * 必填字段（与 `@/types/memory` 一致）：
 *
 * - `id`：全局唯一字符串，建议 `memory-xxx`，勿重复。
 *
 * - `type`：记忆类型枚举，用于语义分类：`photo` | `date` | `chat` | `location` | `music`。
 *   （当前渲染上主要区分展示逻辑；可按需选用。）
 *
 * - `title`：短标题，详情页大标题。
 *
 * - `date`：展示用日期字符串，格式自定，例如 `2024.07.12`。
 *
 * - `position`：球面上的角位置（单位：弧度）。
 *   - `theta`：绕竖直轴的方位角，范围常用约 `0 ~ 2π`（可用 `Math.PI * 0~2`）。
 *   - `phi`：从 +Y 轴向下量的极角，范围约 `0 ~ π`（`0` 靠「北极」、`π` 靠「南极」）。
 *   与 `MemoryPlanet` 中 `sphericalToCartesian(theta, phi, radius)` 一致。
 *   多个节点请错开 `theta` / `phi`，避免叠在一起。
 *
 * - `orbitRadius`：相对星球半径的倍数。`1` 表示贴在球面；`>1` 表示更外飘的「轨道」感（如 1.1、1.2）。
 *
 * - `color`：节点外圈辉光颜色，CSS 十六进制字符串，如 `#4a90d9`。
 *
 * - `content`：详情页内容，字段均可选，按需组合：
 *   - `text`：正文，支持换行符 `\n`。
 *   - `imageUrl`：图片地址。Vite 下放在 `public/` 里则用根路径，如 `public/memories/a.jpg` → `/memories/a.jpg`。
 *   - `audioUrl`：音频地址，同上；详情页会显示播放按钮。
 *   - `location`：地点标签文案（如城市/景点名），仅展示用。
 *   - `theme`：详情页粒子背景主题：`ocean` | `forest` | `city` | `default`。
 *
 * 编写步骤建议：复制一条现有对象 → 改 `id` → 调 `position` / `orbitRadius` 让节点在球上分散 → 填 `content`。
 */
export const memories: Memory[] = [
  {
    id: 'memory-ocean',
    type: 'photo',
    title: '第一次一起看海',
    date: '2024.07.12',
    position: { theta: Math.PI * 0.3, phi: Math.PI * 0.5 },
    orbitRadius: 1,
    color: '#4a90d9',
    content: {
      text: '那天海风很大，但你的手很暖。',
      imageUrl: '/memories/ocean.jpg',
      audioUrl: '/memories/ocean.mp3',
      theme: 'ocean'
    }
  },
  {
    id: 'memory-first-date',
    type: 'date',
    title: '第一次约会',
    date: '2024.02.14',
    position: { theta: Math.PI * 0.7, phi: Math.PI * 0.3 },
    orbitRadius: 1.15,
    color: '#e85a71',
    content: {
      text: '情人节的咖啡馆，你笑着说我点的拿铁太苦了。',
      imageUrl: '/memories/first-date.jpg',
      theme: 'city'
    }
  },
  {
    id: 'memory-chat',
    type: 'chat',
    title: '深夜的聊天记录',
    date: '2024.03.21',
    position: { theta: Math.PI * 1.2, phi: Math.PI * 0.7 },
    orbitRadius: 1,
    color: '#9b59b6',
    content: {
      text: '"睡了吗？"\n"没有，在想你。"',
      theme: 'default'
    }
  },
  {
    id: 'memory-mountain',
    type: 'location',
    title: '一起爬过的山',
    date: '2024.05.01',
    position: { theta: Math.PI * 1.6, phi: Math.PI * 0.45 },
    orbitRadius: 1.2,
    color: '#2ecc71',
    content: {
      text: '山顶的风景很美，但我只记得你气喘吁吁却还在笑的样子。',
      imageUrl: '/memories/mountain.jpg',
      location: '黄山',
      theme: 'forest'
    }
  },
  {
    id: 'memory-song',
    type: 'music',
    title: '我们的歌',
    date: '2024.06.18',
    position: { theta: Math.PI * 0.1, phi: Math.PI * 0.8 },
    orbitRadius: 1.1,
    color: '#f39c12',
    content: {
      text: '每次听到这首歌，都会想起那个夏天的傍晚。',
      audioUrl: '/memories/our-song.mp3',
      theme: 'default'
    }
  }
]
