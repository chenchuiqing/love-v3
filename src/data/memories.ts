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
 *   - `theme`：详情页粒子背景主题：
 *     白天：`sky`（晴空）| `summit`（山野登山）| `sunshine`（暖阳）| `meadow`（草地春光）；
 *     通用：`ocean` | `forest` | `city` | `default`；
 *     夜景：`night` | `fireworks` | `moonlight` | `neon`。
 *
 * 编写步骤建议：复制一条现有对象 → 改 `id` → 调 `position` / `orbitRadius` 让节点在球上分散 → 填 `content`。
 */
export const memories: Memory[] = [
  {
    id: 'memory-ocean',
    type: 'photo',
    title: '相识',
    date: '2026.02.28',
    position: { theta: Math.PI * 0.3, phi: Math.PI * 0.5 },
    orbitRadius: 1,
    color: '#4a90d9',
    content: {
      text: '"你好，是小平姨给的我你的联系方式，我叫陈垂青。刚加你微信，打个招呼~"\n"哈喽哈喽，我叫陈咏欣"',
      theme: 'ocean'
    }
  },
  {
    id: 'memory-first-date',
    type: 'date',
    title: '第一次见面',
    date: '2026.03.03',
    position: { theta: Math.PI * 0.7, phi: Math.PI * 0.3 },
    orbitRadius: 1.15,
    color: '#e85a71',
    content: {
      text: '元宵节，我们第一次见面，那天还是满月~\n你很漂亮，可比照片美多了！！！\n你看，那晚的烟花 好美~',
      imageUrl: '/memories/yanhua.jpg',
      theme: 'fireworks'
    }
  },
  {
    id: 'memory-chat',
    type: 'chat',
    title: '明信片',
    date: '2026.04.19',
    position: { theta: Math.PI * 1.2, phi: Math.PI * 0.7 },
    orbitRadius: 1,
    color: '#9b59b6',
    content: {
      text: '"字很好看，话也收到了。比起明信片上的字，我更喜欢写字的人。我就当落款是我女朋友了，你未来的旅途，有我！"',
      imageUrl: '/memories/wushang.jpg',
      theme: 'default'
    }
  },
  {
    id: 'memory-mountain',
    type: 'location',
    title: '一起爬过的山',
    date: '2026.03.28',
    position: { theta: Math.PI * 1.6, phi: Math.PI * 0.45 },
    orbitRadius: 1.2,
    color: '#2ecc71',
    content: {
      text: '山顶的风景很美，但我只记得你从山脚到山顶中间都没休息过。',
      imageUrl: '/memories/qiguangding.jpg',
      location: '旗冠顶',
      theme: 'summit'
    }
  },
  {
    id: 'memory-song',
    type: 'music',
    title: '我们的歌',
    date: '2026.05.12',
    position: { theta: Math.PI * 0.1, phi: Math.PI * 0.8 },
    orbitRadius: 1.1,
    color: '#f39c12',
    content: {
      text: '"你好右转哥，分享一首左转灯给你听"',
      imageUrl: '/memories/gequ.jpg',
      audioUrl: '/memories/左转灯.mp3',
      theme: 'default'
    }
  }
]
