<script setup lang="ts">
import { ref } from 'vue';
import PhaseOne from './components/PhaseOne.vue';

const currentPhase = ref(1);

const handlePhaseOneComplete = () => {
  currentPhase.value = 2;
  console.log('进入第二阶段：记忆星球');
};
</script>

<template>
  <main class="app-root">
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
    
    <!-- 占位：第二阶段 -->
    <div v-if="currentPhase === 2" class="phase-two-placeholder">
      <h1>记忆星球（开发中...）</h1>
    </div>
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

.phase-two-placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 50% 50%, #0a1f3d 0%, #000010 65%);
}

.phase-two-placeholder h1 {
  font-size: clamp(1.2rem, 2.2vw, 2rem);
  font-weight: 300;
  letter-spacing: 0.22em;
  text-shadow: 0 0 18px rgba(137, 197, 255, 0.45);
}
</style>

