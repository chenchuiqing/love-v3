<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Memory, PlanetPhase } from '@/types/memory'
import { memories } from '@/data/memories'
import MemoryPlanet from './MemoryPlanet.vue'
import MemoryDetail from './MemoryDetail.vue'

const phase = ref<PlanetPhase>('forming')
const activeMemory = ref<Memory | null>(null)

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
</script>

<template>
  <div class="phase-two">
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
</style>
