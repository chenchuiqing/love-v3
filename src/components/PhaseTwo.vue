<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Memory, PlanetPhase } from '@/types/memory'
import { fetchMemories } from '@/api/memories'
import MemoryPlanet from './MemoryPlanet.vue'
import MemoryDetail from './MemoryDetail.vue'

const props = defineProps<{
  resumeExploring?: boolean
  initialVisitedIds?: string[]
}>()

const route = useRoute()
const router = useRouter()

const phase = ref<PlanetPhase>(props.resumeExploring ? 'exploring' : 'forming')
const activeMemory = ref<Memory | null>(null)
const targetCommentId = ref<string | null>(null)
const visitedIds = ref(new Set<string>(props.initialVisitedIds ?? []))
const memories = ref<Memory[]>([])
const isLoading = ref(true)
const loadError = ref('')

const emit = defineEmits<{
  (e: 'complete'): void
  (e: 'visitedUpdate', ids: string[]): void
}>()

const syncVisitedToParent = () => {
  emit('visitedUpdate', Array.from(visitedIds.value))
}

const CORE_ACTIVATE_THRESHOLD = 3
const CORE_HINT_DURATION_MS = 4500

const showDetail = computed(() => phase.value === 'viewing' && activeMemory.value !== null)
const coreHintVisible = ref(false)
const coreHintShownForSession = ref(
  (props.initialVisitedIds?.length ?? 0) >= CORE_ACTIVATE_THRESHOLD
)
let coreHintTimer: ReturnType<typeof setTimeout> | null = null

const clearCoreHintTimer = () => {
  if (coreHintTimer !== null) {
    clearTimeout(coreHintTimer)
    coreHintTimer = null
  }
}

const showCoreHintBriefly = () => {
  clearCoreHintTimer()
  coreHintVisible.value = true
  coreHintTimer = setTimeout(() => {
    coreHintVisible.value = false
    coreHintTimer = null
  }, CORE_HINT_DURATION_MS)
}

const handleFormingComplete = () => {
  phase.value = 'exploring'
}

const handleNodeClick = (memory: Memory) => {
  visitedIds.value.add(memory.id)
  syncVisitedToParent()
  activeMemory.value = memory
  phase.value = 'zooming'
}

const handleZoomComplete = () => {
  if (phase.value !== 'zooming') return
  phase.value = 'viewing'
}

const handleDetailClose = () => {
  phase.value = 'returning'
  // 清除 URL 中的通知跳转参数，防止刷新后再次打开
  router.replace({ query: {} })
}

const handleReturnComplete = () => {
  if (phase.value !== 'returning') return
  activeMemory.value = null
  phase.value = 'exploring'
  if (
    visitedIds.value.size >= CORE_ACTIVATE_THRESHOLD &&
    !coreHintShownForSession.value
  ) {
    coreHintShownForSession.value = true
    showCoreHintBriefly()
  }
}

const handleCoreActivate = () => {
  if (phase.value !== 'exploring') return
  phase.value = 'awakening'
}

const handleAwakeningComplete = () => {
  syncVisitedToParent()
  emit('complete')
}

onMounted(() => {
  fetchMemories()
    .then((list) => {
      memories.value = list
      
      // 检查 URL 参数，如果有 memoryId 则自动打开对应记忆点
      const memoryId = route.query.memoryId as string | undefined
      const commentId = route.query.commentId as string | undefined
      
      if (memoryId) {
        const memory = list.find(m => m.id === memoryId)
        if (memory) {
          // 设置目标评论 ID
          if (commentId) {
            targetCommentId.value = commentId
          }
          // 模拟点击记忆点，打开详情
          handleNodeClick(memory)
        }
      }
    })
    .catch((error: unknown) => {
      loadError.value = error instanceof Error ? error.message : '加载记忆失败'
      memories.value = []
    })
    .finally(() => {
      isLoading.value = false
    })

  if (props.resumeExploring && visitedIds.value.size > 0) {
    syncVisitedToParent()
  }
})

// 监听路由参数变化，当已在 Phase 2 时处理通知跳转
watch(() => ({ memoryId: route.query.memoryId, commentId: route.query.commentId }), (current, previous) => {
  const memoryId = current.memoryId as string | undefined
  console.log('[PhaseTwo] query watcher:', { current, prev: previous, phase: phase.value, memoriesLen: memories.value.length })
  if (!memoryId) return
  // 初始加载流程由 onMounted 处理，这里跳过
  if (memories.value.length === 0 || phase.value === 'forming') {
    console.log('[PhaseTwo] watcher skipped:', { memoriesLen: memories.value.length, phase: phase.value })
    return
  }

  const commentId = current.commentId as string | undefined
  const memory = memories.value.find(m => m.id === memoryId)

  if (!memory) {
    console.log('[PhaseTwo] watcher: memory not found:', memoryId)
    return
  }

  // 如果同一个记忆点已打开，只需更新滚动目标评论
  const sameMemory = previous && previous.memoryId === memoryId
  if (sameMemory && activeMemory.value && showDetail.value) {
    console.log('[PhaseTwo] watcher: same memory, updating comment target only')
    targetCommentId.value = commentId ?? null
    return
  }

  // 不同记忆点或详情未打开，完整打开
  console.log('[PhaseTwo] watcher: different memory, calling handleNodeClick')
  targetCommentId.value = commentId ?? null
  handleNodeClick(memory)
})

onUnmounted(() => {
  clearCoreHintTimer()
})
</script>

<template>
  <div class="phase-two">
    <p v-if="isLoading" class="load-status">正在加载记忆...</p>
    <p v-else-if="loadError" class="load-status load-status--error">
      记忆加载失败：{{ loadError }}
    </p>

    <MemoryPlanet
      v-if="!isLoading"
      :phase="phase"
      :memories="memories"
      :active-memory="activeMemory"
      :skip-forming="resumeExploring"
      :initial-visited-ids="resumeExploring ? Array.from(visitedIds) : undefined"
      @forming-complete="handleFormingComplete"
      @node-click="handleNodeClick"
      @core-activate="handleCoreActivate"
      @zoom-complete="handleZoomComplete"
      @return-complete="handleReturnComplete"
      @awakening-complete="handleAwakeningComplete"
    />

    <p
      v-if="!isLoading && !loadError && memories.length === 0"
      class="load-status"
    >
      暂无记忆点，请在后台添加或执行 bun run seed
    </p>

    <Transition
      enter-active-class="transition-opacity duration-500"
      leave-active-class="transition-opacity duration-500"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <p v-if="coreHintVisible" class="core-hint">
        你已点亮 3 段记忆，现在，触碰星球的心脏
      </p>
    </Transition>

    <Transition
      enter-active-class="transition-opacity duration-500"
      leave-active-class="transition-opacity duration-500"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <MemoryDetail
        v-if="showDetail && activeMemory"
        :memory="activeMemory"
        :scroll-to-comment-id="targetCommentId"
        @close="handleDetailClose"
      />
    </Transition>
  </div>
</template>

<style scoped>
.phase-two {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #000010;
  overflow: hidden;
}

.core-hint {
  position: absolute;
  top: 4.25rem;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 0.45rem 0.95rem;
  border: 1px solid rgba(255, 198, 227, 0.38);
  border-radius: 999px;
  background: rgba(26, 8, 36, 0.5);
  backdrop-filter: blur(8px);
  color: rgba(255, 230, 245, 0.95);
  font-size: 0.78rem;
  letter-spacing: 0.03em;
  z-index: 10;
}

.load-status {
  position: absolute;
  top: 1.2rem;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 0.42rem 0.85rem;
  border-radius: 999px;
  background: rgba(24, 24, 36, 0.65);
  color: #e5ecff;
  font-size: 0.76rem;
  z-index: 11;
}

.load-status--error {
  background: rgba(80, 28, 28, 0.62);
  color: #ffe3e3;
}
</style>
