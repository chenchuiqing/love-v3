<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import PhaseOne from './components/PhaseOne.vue';
import PhaseTwo from './components/PhaseTwo.vue';
import PhaseThree from './components/PhaseThree.vue';

const currentPhase = ref(1);
const isTransitioning = ref(false);
const isFullscreen = ref(false);
const appRef = ref<HTMLElement | null>(null);

const handlePhaseOneComplete = () => {
  isTransitioning.value = true;
  setTimeout(() => {
    currentPhase.value = 2;
    setTimeout(() => {
      isTransitioning.value = false;
    }, 1200);
  }, 800);
};

const handlePhaseTwoComplete = () => {
  isTransitioning.value = true;
  setTimeout(() => {
    currentPhase.value = 3;
    setTimeout(() => {
      isTransitioning.value = false;
    }, 1200);
  }, 800);
};

const handleAct1Complete = () => {
  console.info('阶段三第一幕已完成，待接入第二幕');
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

    <!-- 阶段过渡光芒 -->
    <Transition name="flash">
      <div v-if="isTransitioning" class="transition-flash"></div>
    </Transition>

    <!-- 第一阶段：初见（星尘环绕） -->
    <Transition name="phase-fade">
      <PhaseOne 
        v-if="currentPhase === 1" 
        @complete="handlePhaseOneComplete" 
      />
    </Transition>
    
    <!-- 第二阶段：记忆星球 -->
    <Transition name="phase-fade">
      <PhaseTwo v-if="currentPhase === 2" @complete="handlePhaseTwoComplete" />
    </Transition>

    <!-- 第三阶段：手绘爱心 -->
    <Transition name="phase-fade">
      <PhaseThree v-if="currentPhase === 3" @act1-complete="handleAct1Complete" />
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

/* 阶段切换淡入淡出 */
.phase-fade-enter-active {
  transition: opacity 1.2s ease;
}
.phase-fade-leave-active {
  transition: opacity 0.6s ease;
}
.phase-fade-enter-from,
.phase-fade-leave-to {
  opacity: 0;
}

/* 过渡光芒效果 */
.transition-flash {
  position: fixed;
  inset: 0;
  z-index: 8000;
  pointer-events: none;
  background: radial-gradient(circle at 50% 50%, rgba(200, 230, 255, 0.9) 0%, rgba(100, 180, 255, 0.4) 30%, transparent 70%);
}
.flash-enter-active {
  transition: opacity 0.4s ease-out;
}
.flash-leave-active {
  transition: opacity 1.2s ease-in;
}
.flash-enter-from {
  opacity: 0;
}
.flash-leave-to {
  opacity: 0;
}
</style>

