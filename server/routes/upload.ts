import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'

import { Hono } from 'hono'

import { requireAuth, type AppVariables } from '../auth'
import { env } from '../config'

const IMAGE_PREFIX = 'image/'
const VIDEO_PREFIX = 'video/'
const ALLOWED_AUDIO = new Set(['audio/mpeg', 'audio/mp3'])
const MAX_UPLOAD_SIZE = 100 * 1024 * 1024

const safeFileName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-')
}

const buildStoredFileName = (originalName: string): string => {
  const ext = extname(originalName).slice(0, 16)
  return `${Date.now()}-${randomUUID()}${ext}`
}

const isAllowedMime = (mimeType: string): boolean => {
  return mimeType.startsWith(IMAGE_PREFIX) || mimeType.startsWith(VIDEO_PREFIX) || ALLOWED_AUDIO.has(mimeType)
}

export const uploadRoutes = new Hono<{ Variables: AppVariables }>()

uploadRoutes.post('/admin/upload', requireAuth, async (c) => {
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
