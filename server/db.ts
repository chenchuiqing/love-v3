import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { env } from './config'

const dbPath = join(env.DATA_DIR, 'memories.db')

mkdirSync(dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)

db.exec(`
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  color TEXT NOT NULL,
  theta REAL NOT NULL,
  phi REAL NOT NULL,
  orbit_radius REAL NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memories_sort_order ON memories(sort_order);
`)
