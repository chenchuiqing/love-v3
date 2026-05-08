<script setup lang="ts">
import { ref } from 'vue';
import PhaseOne from './components/PhaseOne.vue';
import PhaseTwo from './components/PhaseTwo.vue';

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

</style>

