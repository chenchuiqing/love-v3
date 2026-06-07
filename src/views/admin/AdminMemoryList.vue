<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { Memory } from '@/types/memory'
import { ApiError } from '@/api/client'
import { deleteAdminMemory, fetchAdminMemories } from '@/api/memories'

const memories = ref<Memory[]>([])
const loading = ref(false)
const errorMessage = ref('')
const deletingId = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

const toDateNum = (s: string) => {
  const m = s.match(/^(\d{4})[.\u5e74]\s*(\d{1,2})[.\u6708]\s*(\d{1,2})\u65e5/)
  return m ? `${m[1]}${m[2].padStart(2, '0')}${m[3].padStart(2, '0')}` : s
}

const sortMemories = (data: Memory[]) => {
  const sorted = data.sort((a, b) => {
    const da = toDateNum(a.date)
    const db = toDateNum(b.date)
    return da.localeCompare(db)
  })
  if (sortOrder.value === 'desc') sorted.reverse()
  return sorted
}

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  memories.value = sortMemories(memories.value)
}

const loadMemories = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await fetchAdminMemories()
    memories.value = sortMemories(data)
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '加载失败'
    }
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id: string, title: string) => {
  const ok = window.confirm(`确认删除「${title}」吗？`)
  if (!ok) return

  deletingId.value = id
  errorMessage.value = ''
  try {
    await deleteAdminMemory(id)
    memories.value = memories.value.filter((item) => item.id !== id)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      errorMessage.value = '登录已失效，请重新登录'
      return
    }
    if (error instanceof Error) {
      errorMessage.value = error.message
      return
    }
    errorMessage.value = '删除失败'
  } finally {
    deletingId.value = ''
  }
}

onMounted(() => {
  void loadMemories()
})
</script>

<template>
  <section class="panel">
    <div class="toolbar">
      <RouterLink class="primary" :to="{ name: 'AdminMemoryCreate' }">新增记忆点</RouterLink>
      <button type="button" @click="loadMemories">刷新</button>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="loading" class="hint">加载中...</p>

    <table v-else class="table">
      <thead>
        <tr>
          <th>标题</th>
          <th class="th-date" @click="toggleSort">
            日期 {{ sortOrder === 'asc' ? '↑' : '↓' }}
          </th>
          <th>类型</th>
          <th>颜色</th>
          <th>坐标</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in memories" :key="item.id">
          <td data-label="标题">{{ item.title }}</td>
          <td data-label="日期">{{ item.date }}</td>
          <td data-label="类型">{{ item.type }}</td>
          <td data-label="颜色">
            <span class="color-dot" :style="{ backgroundColor: item.color }"></span>
            <span class="color-value">{{ item.color }}</span>
          </td>
          <td data-label="坐标" class="coord-cell">
            θ {{ item.position.theta.toFixed(2) }} / φ {{ item.position.phi.toFixed(2) }} /
            r {{ item.orbitRadius.toFixed(2) }}
          </td>
          <td data-label="操作" class="actions-cell">
            <a :href="`/?memory=${item.id}`" target="_blank" rel="noreferrer">预览</a>
            <RouterLink :to="{ name: 'AdminMemoryEdit', params: { id: item.id } }">编辑</RouterLink>
            <button
              type="button"
              class="danger"
              :disabled="deletingId === item.id"
              @click="handleDelete(item.id, item.title)"
            >
              {{ deletingId === item.id ? '删除中...' : '删除' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.panel {
  display: grid;
  gap: 0.8rem;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.primary {
  border-radius: 0.45rem;
  padding: 0.45rem 0.7rem;
  background: #243b76;
  color: #fff;
  text-decoration: none;
}

button {
  border: 1px solid #c5cedd;
  border-radius: 0.45rem;
  padding: 0.38rem 0.6rem;
  background: #fff;
  cursor: pointer;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #d4dbeb;
}

th,
td {
  border-bottom: 1px solid #ecf0f8;
  padding: 0.55rem;
  font-size: 0.92rem;
  text-align: left;
}

thead th {
  background: #f8faff;
}

.th-date {
  cursor: pointer;
  user-select: none;
}

.th-date:hover {
  background: #eef3fe;
}

.color-dot {
  display: inline-block;
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 999px;
  margin-right: 0.35rem;
  border: 1px solid #c4cad7;
  vertical-align: middle;
}

.actions-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.actions-cell a {
  color: #304f9f;
  text-decoration: none;
}

.danger {
  border-color: #c43e3e;
  color: #c43e3e;
}

.error {
  color: #b72929;
  margin: 0;
}

.hint {
  color: #63708c;
  margin: 0;
}

@media (max-width: 768px) {
  .table thead {
    display: none;
  }

  .table,
  .table tbody,
  .table tr,
  .table td {
    display: block;
  }

  .table tr {
    margin-bottom: 0.75rem;
    border: 1px solid #d4dbeb;
    border-radius: 0.5rem;
    padding: 0.6rem 0.75rem;
    background: #fff;
  }

  .table td {
    border: none;
    padding: 0.3rem 0;
    font-size: 0.88rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #5a6377;
    flex-shrink: 0;
    min-width: 3.2em;
  }

  .coord-cell {
    display: none !important;
  }

  .color-value {
    display: none;
  }

  .actions-cell {
    padding-top: 0.5rem !important;
    border-top: 1px solid #ecf0f8 !important;
    margin-top: 0.3rem;
  }

  .actions-cell::before {
    display: none;
  }

  .actions-cell a,
  .actions-cell button {
    font-size: 0.85rem;
    padding: 0.3rem 0.5rem;
  }
}
</style>
