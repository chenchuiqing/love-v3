import type { Memory } from '@/types/memory'

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
