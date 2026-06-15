<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { Memory } from '@/types/memory'
import { ApiError } from '@/api/client'
import { deletePublishMemory, fetchPublishMemories } from '@/api/memories'

const memories = ref<Memory[]>([])
const loading = ref(false)
const errorMessage = ref('')
const deletingId = ref('')
const sortOrder = ref<'asc' | 'desc'>('desc')
const confirmVisible = ref(false)
const confirmTarget = ref<{ id: string; title: string } | null>(null)

const openConfirm = (id: string, title: string) => {
  confirmTarget.value = { id, title }
  confirmVisible.value = true
}

const cancelDelete = () => {
  confirmVisible.value = false
  confirmTarget.value = null
}

const toDateNum = (s: string) => {
  const cn = s.match(/^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/)
  if (cn) return `${cn[1]}${cn[2].padStart(2, '0')}${cn[3].padStart(2, '0')}`
  const dot = s.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})/)
  if (dot) return `${dot[1]}${dot[2].padStart(2, '0')}${dot[3].padStart(2, '0')}`
  return s
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
    const data = await fetchPublishMemories()
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

const handleDelete = async () => {
  if (!confirmTarget.value) return
  const { id } = confirmTarget.value

  deletingId.value = id
  errorMessage.value = ''
  confirmVisible.value = false
  try {
    await deletePublishMemory(id)
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
    confirmTarget.value = null
  }
}

onMounted(() => {
  void loadMemories()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2.5">
        <RouterLink
          class="inline-flex items-center gap-1 px-4 py-2 bg-[#243b76] text-white text-sm font-medium rounded-lg hover:bg-[#1a2d5e] transition-colors no-underline shadow-sm"
          :to="{ name: 'PublishMemoryCreate' }"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新增记忆点
        </RouterLink>
        <button
          type="button"
          class="px-3.5 py-2 bg-white border border-[#c5cedd] text-[#374151] text-sm rounded-lg hover:bg-[#f3f5f9] transition-colors cursor-pointer"
          @click="loadMemories"
        >
          刷新
        </button>
        <span class="hidden sm:inline-flex items-center gap-1 ml-1 text-sm text-[#6b7280]">
          共 <span class="font-semibold text-[#243b76]">{{ memories.length }}</span> 个记忆点
        </span>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-1 px-3.5 py-2 bg-white border border-[#c5cedd] text-[#374151] text-sm rounded-lg hover:bg-[#f3f5f9] transition-colors cursor-pointer sm:hidden"
        @click="toggleSort"
      >
        {{ sortOrder === 'asc' ? '↑ 升序' : '↓ 降序' }}
      </button>
    </div>

    <!-- Error -->
    <p v-if="errorMessage" class="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] text-[#b72929] text-sm rounded-lg m-0">
      {{ errorMessage }}
    </p>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16 text-[#63708c] text-sm">
      <svg class="w-5 h-5 mr-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      加载中...
    </div>

    <!-- Empty -->
    <div v-if="!loading && !errorMessage && memories.length === 0" class="flex flex-col items-center justify-center py-16 text-[#9ca3af]">
      <svg class="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="text-sm m-0">暂无记忆点，点击上方按钮创建第一个</p>
    </div>

    <!-- Desktop Table + Mobile Cards -->
    <div v-if="!loading && memories.length > 0" class="bg-white rounded-xl border border-[#d4dbeb] overflow-hidden shadow-sm">
      <!-- Table header (desktop only) -->
      <div class="hidden sm:grid sm:grid-cols-[1fr_120px_90px_110px_1fr_180px] bg-[#f8faff] border-b border-[#e5eaf4]">
        <div class="px-4 py-3 text-xs font-semibold text-[#5a6377] uppercase tracking-wide">标题</div>
        <div
          class="px-4 py-3 text-xs font-semibold text-[#5a6377] uppercase tracking-wide cursor-pointer select-none hover:bg-[#eef3fe] transition-colors flex items-center gap-1"
          @click="toggleSort"
        >
          日期
          <span class="text-[10px]">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
        </div>
        <div class="px-4 py-3 text-xs font-semibold text-[#5a6377] uppercase tracking-wide">类型</div>
        <div class="px-4 py-3 text-xs font-semibold text-[#5a6377] uppercase tracking-wide">颜色</div>
        <div class="px-4 py-3 text-xs font-semibold text-[#5a6377] uppercase tracking-wide hidden md:block">坐标</div>
        <div class="px-4 py-3 text-xs font-semibold text-[#5a6377] uppercase tracking-wide">操作</div>
      </div>

      <!-- Rows -->
      <div
        v-for="item in memories"
        :key="item.id"
        class="border-b border-[#ecf0f8] last:border-b-0 bg-white hover:bg-[#f9faff] transition-colors"
      >
        <!-- Desktop row -->
        <div class="hidden sm:grid sm:grid-cols-[1fr_120px_90px_110px_1fr_180px] items-center">
          <div class="px-4 py-3 text-sm font-medium text-[#1d2433] truncate">{{ item.title }}</div>
          <div class="px-4 py-3 text-sm text-[#5a6377]">{{ item.date }}</div>
          <div class="px-4 py-3">
            <span class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-[#f0f3fa] text-[#4a597f]">
              {{ item.type }}
            </span>
          </div>
          <div class="px-4 py-3 flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded-full border border-[#c4cad7] flex-shrink-0" :style="{ backgroundColor: item.color }"></span>
            <span class="text-xs text-[#5a6377] font-mono">{{ item.color }}</span>
          </div>
          <div class="px-4 py-3 text-xs text-[#8b95ad] font-mono hidden md:block truncate">
            θ{{ item.position.theta.toFixed(2) }} φ{{ item.position.phi.toFixed(2) }} r{{ item.orbitRadius.toFixed(2) }}
          </div>
          <div class="px-4 py-3 flex items-center gap-3 text-sm">
            <a
              :href="`/?memoryId=${item.id}`"
              class="text-[#304f9f] no-underline hover:underline font-medium"
            >预览</a>
            <RouterLink
              :to="{ name: 'PublishMemoryEdit', params: { id: item.id } }"
              class="text-[#304f9f] no-underline hover:underline font-medium"
            >编辑</RouterLink>
            <button
              type="button"
              class="px-2.5 py-1 text-sm font-medium text-[#c43e3e] border border-[#e5b8b8] rounded-md hover:bg-[#fef2f2] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="deletingId === item.id"
              @click="openConfirm(item.id, item.title)"
            >
              {{ deletingId === item.id ? '删除中...' : '删除' }}
            </button>
          </div>
        </div>

        <!-- Mobile card -->
        <div class="sm:hidden p-4">
          <div class="flex items-start justify-between mb-3">
            <h3 class="text-sm font-semibold text-[#1d2433] m-0 leading-relaxed">{{ item.title }}</h3>
            <div class="flex items-center gap-2.5 flex-shrink-0 ml-3">
              <a :href="`/?memoryId=${item.id}`" class="text-xs text-[#304f9f] no-underline font-medium">预览</a>
              <RouterLink :to="{ name: 'PublishMemoryEdit', params: { id: item.id } }" class="text-xs text-[#304f9f] no-underline font-medium">编辑</RouterLink>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-[#9ca3af]">日期</span>
              <span class="text-[#5a6377]">{{ item.date }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-[#9ca3af]">类型</span>
              <span class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-[#f0f3fa] text-[#4a597f]">{{ item.type }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-[#9ca3af]">颜色</span>
              <span class="w-3.5 h-3.5 rounded-full border border-[#c4cad7]" :style="{ backgroundColor: item.color }"></span>
              <span class="font-mono text-xs text-[#5a6377]">{{ item.color }}</span>
            </div>
          </div>

          <div class="mt-3 pt-3 border-t border-[#ecf0f8]">
            <button
              type="button"
              class="w-full px-3 py-2 text-sm font-medium text-[#c43e3e] border border-[#e5b8b8] rounded-md hover:bg-[#fef2f2] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="deletingId === item.id"
              @click="openConfirm(item.id, item.title)"
            >
              {{ deletingId === item.id ? '删除中...' : '删除' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Footer count (mobile only) -->
      <div class="sm:hidden px-4 py-3 bg-[#f8faff] border-t border-[#e5eaf4] text-center text-xs text-[#9ca3af]">
        共 {{ memories.length }} 个记忆点
      </div>
    </div>

    <!-- Confirm Dialog -->
    <Teleport to="body">
      <div
        v-if="confirmVisible"
        class="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[9999]"
        @click.self="cancelDelete"
      >
        <div class="bg-white rounded-xl p-6 w-[min(380px,90vw)] shadow-2xl">
          <div class="flex items-start gap-3 mb-5">
            <div class="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-[#c43e3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-[#1d2433] m-0 mb-1">确认删除</h3>
              <p class="text-sm text-[#6b7280] m-0">「{{ confirmTarget?.title }}」将被永久删除，无法恢复。</p>
            </div>
          </div>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#d1d5db] rounded-lg hover:bg-[#f9fafb] transition-colors cursor-pointer"
              @click="cancelDelete"
            >
              取消
            </button>
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-white bg-[#c43e3e] border border-[#c43e3e] rounded-lg hover:bg-[#a83232] transition-colors cursor-pointer"
              @click="handleDelete"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
