<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterView, useRoute } from 'vue-router'
import PhaseOne from './components/PhaseOne.vue';
import PhaseTwo from './components/PhaseTwo.vue';
import PhaseThree from './components/PhaseThree.vue';
import FloatingMusicPlayer from './components/FloatingMusicPlayer.vue';
import UserProfileDropdown from './components/UserProfileDropdown.vue';

const route = useRoute()
const isPublishRoute = computed(() => route.path.startsWith('/publish'))

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
    document.documentElement.style.overscrollBehavior = ''
    document.body.style.overscrollBehavior = ''
    document.body.style.overflow = ''
    appRoot.style.overflow = 'visible'
    appRoot.style.height = 'auto'
    appRoot.style.minHeight = '100%'
    return
  }

  // 主页模式:
  // overscroll-behavior:none 防弹性滚动（已在 CSS 中设置）
  // <main> 通过 fixed inset-0 填满视口，overflow:hidden 约束画布
  // top-bar 在 <main> 外部，iOS 不会裁剪
  document.body.style.overflow = ''
  appRoot.style.overflow = ''
  appRoot.style.height = ''
  appRoot.style.minHeight = ''
}

onMounted(async () => {
  const el = document.documentElement as HTMLElement & FullscreenElement;
  isFullscreenSupported.value = !!(el.requestFullscreen || el.webkitRequestFullscreen);

  document.addEventListener('fullscreenchange', syncFullscreenState);
  document.addEventListener('webkitfullscreenchange', syncFullscreenState);
  syncFullscreenState();
  applyScrollModeByRoute(isPublishRoute.value)
  
  // 等待路由解析完成
  await nextTick()
  
  // 检查 URL 参数，如果有 memoryId 则直接跳转到 PhaseTwo
  const memoryId = route.query.memoryId as string | undefined
  console.log('[App] onMounted route.query:', route.query, 'memoryId:', memoryId, 'currentPhase:', currentPhase.value)
  if (memoryId && currentPhase.value === 1) {
    currentPhase.value = 2
  }
});

watch(isPublishRoute, (nextValue) => {
  applyScrollModeByRoute(nextValue)
})

// 监听路由参数变化，如果有 memoryId 则跳转到 PhaseTwo
watch(() => route.query.memoryId, (memoryId) => {
  if (memoryId && currentPhase.value !== 2) {
    currentPhase.value = 2
  }
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState);
  document.removeEventListener('webkitfullscreenchange', syncFullscreenState);
  document.documentElement.style.overscrollBehavior = ''
  document.body.style.overscrollBehavior = ''
  document.body.style.overflow = ''
  const appRoot = document.getElementById('app')
  if (appRoot) {
    appRoot.style.overflow = ''
    appRoot.style.height = ''
    appRoot.style.minHeight = ''
  }
});
</script>

<template>
  <RouterView v-if="isPublishRoute" />

  <template v-else>
    <!--
      顶部工具栏 — 在 overflow:hidden 容器外部
      iOS Safari 经典 bug: overflow:hidden 会裁剪 position:fixed 子元素
      放在 <main> 外部（作为 #app 的直接子元素）可避免此问题
    -->
    <div
      class="fixed z-[9999] flex items-center gap-2"
      style="top: calc(1rem + env(safe-area-inset-top, 0px)); right: calc(1rem + env(safe-area-inset-right, 0px));"
    >
      <UserProfileDropdown />
      <button
        v-if="isFullscreenSupported"
        class="px-3 py-[0.45rem] border border-[rgba(163,218,255,0.45)] rounded-full bg-[rgba(4,20,48,0.55)] text-[rgba(236,247,255,0.95)] text-xs tracking-[0.08em] backdrop-blur-lg cursor-pointer transition-all duration-[220ms] ease hover:border-[rgba(188,229,255,0.82)] hover:shadow-[0_0_16px_rgba(123,193,255,0.35)] hover:-translate-y-px"
        @click="toggleFullscreen"
      >
        {{ isFullscreen ? '退出全屏' : '进入全屏' }}
      </button>
    </div>

    <main ref="appRef" class="fixed top-0 left-0 right-0 bg-[#000010] text-white overflow-hidden" style="height: 100dvh;">
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
    </main>

    <!-- 全局浮动音乐播放器 — 也在 main 外部 -->
    <FloatingMusicPlayer />
  </template>
</template>

<style>
/*
 * iOS Safari 兼容说明:
 * - html/body 只设 overscroll-behavior:none 防弹性滚动，不设 overflow:hidden
 * - <main> 使用 fixed inset-0 + overflow:hidden 填满视口并约束 Three.js 画布
 * - top-bar (fixed) 与 <main> 是兄弟节点，不会被 overflow:hidden 裁剪
 * - #app 不设任何 overflow/position 限制
 */
html,
body,
#app {
  width: 100%;
  margin: 0;
  padding: 0;
}

html {
  overscroll-behavior: none;
  background: #000010;
}

body {
  overscroll-behavior: none;
  background: #000010;
}

#app {
  background: #000010;
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

