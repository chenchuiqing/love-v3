process.env.ADMIN_PASSWORD ??= 'seed-only-password'
process.env.SESSION_SECRET ??= 'seed-only-session-secret-1234567890'

const [{ createMemory, getMemoryById, updateMemory }, { memories }] = await Promise.all([
  import('./memories'),
  import('../src/data/memories'),
])

let created = 0
let updated = 0

for (const [index, memory] of memories.entries()) {
  const existing = getMemoryById(memory.id)
  if (!existing) {
    createMemory({
      id: memory.id,
      type: memory.type,
      title: memory.title,
      date: memory.date,
      color: memory.color,
      orbitRadius: memory.orbitRadius,
      position: memory.position,
      content: memory.content,
      sortOrder: index,
    })
    created += 1
    continue
  }

  updateMemory(memory.id, {
    type: memory.type,
    title: memory.title,
    date: memory.date,
    color: memory.color,
    orbitRadius: memory.orbitRadius,
    position: memory.position,
    content: memory.content,
    sortOrder: index,
  })
  updated += 1
}

console.log(`Seed 完成：新增 ${created} 条，更新 ${updated} 条，总计 ${memories.length} 条。`)
