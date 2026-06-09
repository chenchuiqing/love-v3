export type MemoryType = 'photo' | 'date' | 'chat' | 'location' | 'music'
export type ParticleTheme =
  | 'ocean'
  | 'forest'
  | 'city'
  | 'default'
  | 'sky'
  | 'summit'
  | 'sunshine'
  | 'meadow'
  | 'night'
  | 'fireworks'
  | 'moonlight'
  | 'neon'

export interface MemoryPosition {
  theta: number
  phi: number
}

export interface MemoryContent {
  text?: string
  imageUrl?: string
  imageUrls?: string[]
  audioUrl?: string
  videoUrl?: string
  location?: string
  theme?: ParticleTheme
}

export interface Memory {
  id: string
  type: MemoryType
  title: string
  date: string
  position: MemoryPosition
  orbitRadius: number
  color: string
  content: MemoryContent
}

export type PlanetPhase = 'forming' | 'exploring' | 'zooming' | 'viewing' | 'returning' | 'awakening'

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

export type NotificationType = 'new_memory' | 'new_comment' | 'new_reply'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  content: string | null
  memoryId: string
  commentId: string | null
  actorId: string
  actorName: string
  isRead: boolean
  createdAt: string
}
