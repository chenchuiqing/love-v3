import { db } from './db'
import {
  defaultMemoryColor,
  defaultOrbitRadius,
  generateDistributedPoint,
  type SphericalPoint,
} from './spherical'
import type { CreateMemoryInput, MemoryDto, UpdateMemoryInput } from './types'

interface MemoryRow {
  id: string
  type: MemoryDto['type']
  title: string
  date: string
  color: string
  theta: number
  phi: number
  orbit_radius: number
  content: string
  sort_order: number | null
}

const listStmt = db.query<MemoryRow, []>(
  `SELECT id, type, title, date, color, theta, phi, orbit_radius, content, sort_order
   FROM memories
   ORDER BY sort_order IS NULL, sort_order ASC, datetime(created_at) ASC`,
)
const getByIdStmt = db.query<MemoryRow, [string]>(
  `SELECT id, type, title, date, color, theta, phi, orbit_radius, content, sort_order
   FROM memories WHERE id = ?1`,
)

const createStmt = db.prepare(
  `INSERT INTO memories (id, type, title, date, color, theta, phi, orbit_radius, content, sort_order)
   VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
)

const updateStmt = db.prepare(
  `UPDATE memories
   SET type = ?2,
       title = ?3,
       date = ?4,
       color = ?5,
       theta = ?6,
       phi = ?7,
       orbit_radius = ?8,
       content = ?9,
       sort_order = ?10,
       updated_at = CURRENT_TIMESTAMP
   WHERE id = ?1`,
)

const deleteStmt = db.prepare('DELETE FROM memories WHERE id = ?1')
const countStmt = db.query<{ count: number }, []>('SELECT COUNT(1) as count FROM memories')

const parseContent = (raw: string): MemoryDto['content'] => {
  try {
    return JSON.parse(raw) as MemoryDto['content']
  } catch {
    return {}
  }
}

const rowToDto = (row: MemoryRow): MemoryDto => {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    date: row.date,
    color: row.color,
    orbitRadius: row.orbit_radius,
    position: {
      theta: row.theta,
      phi: row.phi,
    },
    content: parseContent(row.content),
    sortOrder: row.sort_order ?? undefined,
  }
}

export const listMemories = (): MemoryDto[] => {
  return listStmt.all().map(rowToDto)
}

export const getMemoryById = (id: string): MemoryDto | null => {
  const row = getByIdStmt.get(id)
  return row ? rowToDto(row) : null
}

const getExistingPoints = (): SphericalPoint[] => {
  const rows = db.query<{ theta: number; phi: number }, []>('SELECT theta, phi FROM memories').all()
  return rows.map((row) => ({ theta: row.theta, phi: row.phi }))
}

const getCurrentCount = (): number => {
  return countStmt.get()?.count ?? 0
}

export const createMemory = (input: CreateMemoryInput): MemoryDto => {
  if (getMemoryById(input.id)) {
    throw new Error('ID 已存在')
  }

  const count = getCurrentCount()
  const autoPoint = generateDistributedPoint(getExistingPoints())

  const position = input.position ?? autoPoint
  const color = input.color ?? defaultMemoryColor(count)
  const orbitRadius = input.orbitRadius ?? defaultOrbitRadius(count)

  createStmt.run(
    input.id,
    input.type,
    input.title,
    input.date,
    color,
    position.theta,
    position.phi,
    orbitRadius,
    JSON.stringify(input.content ?? {}),
    input.sortOrder ?? null,
  )

  return getMemoryById(input.id) as MemoryDto
}

export const updateMemory = (id: string, input: UpdateMemoryInput): MemoryDto | null => {
  const existing = getMemoryById(id)
  if (!existing) {
    return null
  }

  const next = {
    type: input.type ?? existing.type,
    title: input.title ?? existing.title,
    date: input.date ?? existing.date,
    color: input.color ?? existing.color,
    theta: input.position?.theta ?? existing.position.theta,
    phi: input.position?.phi ?? existing.position.phi,
    orbitRadius: input.orbitRadius ?? existing.orbitRadius,
    content: input.content ? { ...existing.content, ...input.content } : existing.content,
    sortOrder: input.sortOrder === undefined ? (existing.sortOrder ?? null) : input.sortOrder,
  }

  updateStmt.run(
    id,
    next.type,
    next.title,
    next.date,
    next.color,
    next.theta,
    next.phi,
    next.orbitRadius,
    JSON.stringify(next.content),
    next.sortOrder,
  )

  return getMemoryById(id)
}

export const deleteMemory = (id: string): boolean => {
  const result = deleteStmt.run(id)
  return (result.changes ?? 0) > 0
}
