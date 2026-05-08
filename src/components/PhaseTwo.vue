<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Memory, PlanetPhase } from '@/types/memory'
import { memories } from '@/data/memories'
import MemoryPlanet from './MemoryPlanet.vue'
import MemoryDetail from './MemoryDetail.vue'

const phase = ref<PlanetPhase>('forming')
const activeMemory = ref<Memory | null>(null)
const isFullscreen = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const showDetail = computed(() => phase.value === 'viewing' && activeMemory.value !== null)

const handleFormingComplete = () => {
  phase.value = 'exploring'
}

const handleNodeClick = (memory: Memory) => {
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

const toggleFullscreen = async () => {
  if (!document.fullscreenElement) {
    try {
      await rootRef.value?.requestFullscreen()
      isFullscreen.value = true
    } catch {
      console.warn('全屏请求被拒绝')
    }
  } else {
    await document.exitFullscreen()
    isFullscreen.value = false
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}
</script>

<template>
  <div 
    ref="rootRef"
    class="phase-two"
    @fullscreenchange="handleFullscreenChange"
  >
    <MemoryPlanet
      :phase="phase"
      :memories="memories"
      :active-memory="activeMemory"
      @forming-complete="handleFormingComplete"
      @node-click="handleNodeClick"
      @zoom-complete="handleZoomComplete"
      @return-complete="handleReturnComplete"
    />

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

    <button 
      class="fullscreen-button" 
      @click="toggleFullscreen"
    >
      {{ isFullscreen ? '退出全屏' : '进入全屏' }}
    </button>
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

.fullscreen-button {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 100;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.fullscreen-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}
</style>
