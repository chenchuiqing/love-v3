<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router'
import { checkUserSession } from '@/api/userAuth'
import PhaseOne from './components/PhaseOne.vue';
import PhaseTwo from './components/PhaseTwo.vue';
import PhaseThree from './components/PhaseThree.vue';
import FloatingMusicPlayer from './components/FloatingMusicPlayer.vue';
import NotificationBell from './components/NotificationBell.vue';

const route = useRoute()
const router = useRouter()
const isPublishRoute = computed(() => route.path.startsWith('/publish'))

const isLoggedIn = ref(false)
const currentPhase = ref(1);
const phaseTwoResume = ref(false);
const visitedMemoryIds = ref(new Set<string>());
const isTransitioning = ref(false);
const isFullscreen = ref(false);
const isFullscreenSupported = ref(false);
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
  phaseTwoResume.value = false;
  isTransitioning.value = true;
  setTimeout(() => {
    currentPhase.value = 3;
    setTimeout(() => {
      isTransitioning.value = false;
    }, 1200);
  }, 800);
};

const handleBackToPlanet = () => {
  isTransitioning.value = true;
  setTimeout(() => {
    phaseTwoResume.value = true;
    currentPhase.value = 2;
    setTimeout(() => {
      isTransitioning.value = false;
    }, 1200);
  }, 800);
};

const handleVisitedUpdate = (ids: string[]) => {
  visitedMemoryIds.value = new Set(ids);
};

const handleAct1Complete = () => {
  console.info('阶段三第一幕已完成，待接入第二幕');
};

interface FullscreenElement {
  requestFullscreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
}

interface FullscreenDocument {
  fullscreenElement?: Element | null;
  webkitFullscreenElement?: Element | null;
  webkitIsFullScreen?: boolean;
  exitFullscreen?: () => Promise<void>;
  webkitExitFullscreen?: () => Promise<void>;
}

const toggleFullscreen = async () => {
  if (!appRef.value) return;
  try {
    const el = appRef.value as HTMLElement & FullscreenElement;
    const doc = document as Document & FullscreenDocument;

    const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.webkitIsFullScreen);

    if (isFull) {
      if (doc.exitFullscreen) await doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    } else {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    }
  } catch (error) {
    console.warn('全屏切换失败', error);
  }
};

const syncFullscreenState = () => {
  const doc = document as Document & FullscreenDocument;
  isFullscreen.value = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.webkitIsFullScreen);
};

const applyScrollModeByRoute = (publishMode: boolean) => {
  const appRoot = document.getElementById('app')
  if (!appRoot) return

  if (publishMode) {
    document.documentElement.style.overflow = 'auto'
    document.body.style.overflow = 'auto'
    appRoot.style.height = 'auto'
    appRoot.style.minHeight = '100%'
    return
  }

  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  appRoot.style.height = '100%'
  appRoot.style.minHeight = ''
}

const handleCheckLoginStatus = async () => {
  const user = await checkUserSession()
  isLoggedIn.value = !!user
}

onMounted(() => {
  handleCheckLoginStatus()

  const el = document.documentElement as HTMLElement & FullscreenElement;
  isFullscreenSupported.value = !!(el.requestFullscreen || el.webkitRequestFullscreen);

  document.addEventListener('fullscreenchange', syncFullscreenState);
  document.addEventListener('webkitfullscreenchange', syncFullscreenState);
  syncFullscreenState();
  applyScrollModeByRoute(isPublishRoute.value)
});

watch(isPublishRoute, (isPublish) => {
  if (!isPublish) {
    handleCheckLoginStatus()
  }
})

watch(isPublishRoute, (nextValue) => {
  applyScrollModeByRoute(nextValue)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState);
  document.removeEventListener('webkitfullscreenchange', syncFullscreenState);
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  const appRoot = document.getElementById('app')
  if (appRoot) {
    appRoot.style.height = ''
    appRoot.style.minHeight = ''
  }
});
</script>

<template>
  <RouterView v-if="isPublishRoute" />

  <main v-else ref="appRef" class="app-root">
    <!-- 顶部工具栏 -->
    <div class="top-bar">
      <NotificationBell />
      <button v-if="!isLoggedIn" class="top-bar-btn" @click="router.push('/publish/login')">
        登录
      </button>
      <button v-if="isFullscreenSupported" class="top-bar-btn" @click="toggleFullscreen">
        {{ isFullscreen ? '退出全屏' : '进入全屏' }}
      </button>
    </div>

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
      <PhaseTwo
        v-if="currentPhase === 2"
        :resume-exploring="phaseTwoResume"
        :initial-visited-ids="phaseTwoResume ? Array.from(visitedMemoryIds) : undefined"
        @visited-update="handleVisitedUpdate"
        @complete="handlePhaseTwoComplete"
      />
    </Transition>

    <!-- 第三阶段：手绘爱心 -->
    <Transition name="phase-fade">
      <PhaseThree
        v-if="currentPhase === 3"
        @act1-complete="handleAct1Complete"
        @back-to-planet="handleBackToPlanet"
      />
    </Transition>

    <!-- 全局浮动音乐播放器 -->
    <FloatingMusicPlayer />
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

.top-bar-btn {
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

.top-bar-btn:hover {
  border-color: rgba(188, 229, 255, 0.82);
  box-shadow: 0 0 16px rgba(123, 193, 255, 0.35);
  transform: translateY(-1px);
}

.top-bar {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

