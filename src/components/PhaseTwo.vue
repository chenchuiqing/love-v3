<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Memory, PlanetPhase } from '@/types/memory'
import { memories } from '@/data/memories'
import MemoryPlanet from './MemoryPlanet.vue'
import MemoryDetail from './MemoryDetail.vue'

const props = defineProps<{
  resumeExploring?: boolean
  initialVisitedIds?: string[]
}>()

const phase = ref<PlanetPhase>(props.resumeExploring ? 'exploring' : 'forming')
const activeMemory = ref<Memory | null>(null)
const visitedIds = ref(new Set<string>(props.initialVisitedIds ?? []))

const emit = defineEmits<{
  (e: 'complete'): void
  (e: 'visitedUpdate', ids: string[]): void
}>()

const syncVisitedToParent = () => {
  emit('visitedUpdate', Array.from(visitedIds.value))
}

const CORE_ACTIVATE_THRESHOLD = 3

const showDetail = computed(() => phase.value === 'viewing' && activeMemory.value !== null)
const showCoreHint = computed(
  () => phase.value === 'exploring' && visitedIds.value.size >= CORE_ACTIVATE_THRESHOLD
)

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
  phase.value = 'viewing'
}

const handleDetailClose = () => {
  phase.value = 'returning'
}

const handleReturnComplete = () => {
  activeMemory.value = null
  phase.value = 'exploring'
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
  if (props.resumeExploring && visitedIds.value.size > 0) {
    syncVisitedToParent()
  }
})
</script>

<template>
  <div class="phase-two">
    <MemoryPlanet
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

    <Transition
      enter-active-class="transition-opacity duration-500"
      leave-active-class="transition-opacity duration-500"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <p v-if="showCoreHint" class="core-hint">
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
</style>
