import { z } from 'zod'

const memoryTypeSchema = z.enum(['photo', 'date', 'chat', 'location', 'music'])
const particleThemeSchema = z.enum([
  'ocean',
  'forest',
  'city',
  'default',
  'sky',
  'summit',
  'sunshine',
  'meadow',
  'night',
  'fireworks',
  'moonlight',
  'neon',
])

export const memoryContentSchema = z.object({
  text: z.string().min(1).optional(),
  imageUrl: z.string().min(1).optional(),
  imageUrls: z.array(z.string().min(1)).max(5).optional(),
  audioUrl: z.string().min(1).optional(),
  videoUrl: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  theme: particleThemeSchema.optional(),
})

export const memorySchema = z.object({
  id: z.string().min(1),
  type: memoryTypeSchema,
  title: z.string().min(1),
  date: z.string().min(1),
  position: z.object({
    theta: z.number().finite(),
    phi: z.number().finite(),
  }),
  orbitRadius: z.number().finite().positive(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'color 必须是 #RRGGBB'),
  content: memoryContentSchema,
  sortOrder: z.number().int().optional(),
})

export const createMemoryInputSchema = z.object({
  id: z.string().min(1).optional(),
  type: memoryTypeSchema,
  title: z.string().min(1),
  date: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  orbitRadius: z.number().finite().positive().optional(),
  position: z
    .object({
      theta: z.number().finite(),
      phi: z.number().finite(),
    })
    .optional(),
  content: memoryContentSchema.default({}),
  sortOrder: z.number().int().optional(),
})

export const updateMemoryInputSchema = z.object({
  type: memoryTypeSchema.optional(),
  title: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  orbitRadius: z.number().finite().positive().optional(),
  position: z
    .object({
      theta: z.number().finite(),
      phi: z.number().finite(),
    })
    .optional(),
  content: memoryContentSchema.optional(),
  sortOrder: z.number().int().nullable().optional(),
})

export type MemoryDto = z.infer<typeof memorySchema>
export type CreateMemoryInput = z.infer<typeof createMemoryInputSchema>
export type UpdateMemoryInput = z.infer<typeof updateMemoryInputSchema>
