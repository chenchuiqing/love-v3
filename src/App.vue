<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import PhaseOne from './components/PhaseOne.vue';
import PhaseTwo from './components/PhaseTwo.vue';

const currentPhase = ref(1);
const isFullscreen = ref(false);
const appRef = ref<HTMLElement | null>(null);

const handlePhaseOneComplete = () => {
  currentPhase.value = 2;
  console.log('进入第二阶段：记忆星球');
};

const toggleFullscreen = async () => {
  if (!appRef.value) return;
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await appRef.value.requestFullscreen();
    }
  } catch (error) {
    console.warn('全屏切换失败', error);
  }
};

const syncFullscreenState = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreenState);
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState);
});
</script>

<template>
  <main ref="appRef" class="app-root">
    <!-- 全局全屏按钮 -->
    <button class="fullscreen-button" @click="toggleFullscreen">
      {{ isFullscreen ? '退出全屏' : '进入全屏' }}
    </button>

    <!-- 第一阶段：初见（星尘环绕） -->
    <Transition
      enter-active-class="transition-opacity duration-1000"
      leave-active-class="transition-opacity duration-1000"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <PhaseOne 
        v-if="currentPhase === 1" 
        @complete="handlePhaseOneComplete" 
      />
    </Transition>
    
    <!-- 第二阶段：记忆星球 -->
    <Transition
      enter-active-class="transition-opacity duration-1000"
      leave-active-class="transition-opacity duration-1000"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <PhaseTwo v-if="currentPhase === 2" />
    </Transition>
  </main>
</template>

<style>
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.app-root {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000010;
  color: #fff;
  overflow: hidden;
}

.fullscreen-button {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  padding: 0.45rem 0.8rem;
  border: 1px solid rgba(163, 218, 255, 0.45);
  border-radius: 999px;
  background: rgba(4, 20, 48, 0.55);
  color: rgba(236, 247, 255, 0.95);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition: all 220ms ease;
}

.fullscreen-button:hover {
  border-color: rgba(188, 229, 255, 0.82);
  box-shadow: 0 0 16px rgba(123, 193, 255, 0.35);
  transform: translateY(-1px);
}
</style>

