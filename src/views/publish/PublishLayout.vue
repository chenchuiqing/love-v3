<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import UserProfileDropdown from '@/components/UserProfileDropdown.vue'

const route = useRoute()

const pageTitle = computed(() => {
  if (route.name === 'PublishMemoryCreate') return '新建记忆点'
  if (route.name === 'PublishMemoryEdit') return '编辑记忆点'
  return '记忆点列表'
})
</script>

<template>
  <div class="min-h-screen bg-[#f4f6fb] text-[#1d2433]">
    <header class="flex flex-wrap justify-between items-center gap-4 px-4 py-3 md:px-6 md:py-4 border-b border-[#d8deea] bg-white">
      <div>
        <p class="m-0 text-[#5a6377] text-[0.85rem]">记忆点管理</p>
        <h1 class="m-0 mt-[0.2rem] text-[1.2rem]">{{ pageTitle }}</h1>
      </div>
      <nav class="flex items-center gap-2 md:gap-3">
        <RouterLink class="text-[#304f9f] no-underline font-medium text-sm md:text-[0.88rem]" :to="{ name: 'PublishMemoryList' }">列表</RouterLink>
        <RouterLink class="text-[#304f9f] no-underline font-medium text-sm md:text-[0.88rem]" :to="{ name: 'PublishMemoryCreate' }">新增</RouterLink>
        <span class="text-[#d1d5db] text-[0.85rem] select-none">|</span>
        <RouterLink class="text-[#6b7280] no-underline font-normal text-xs md:text-[0.85rem]" :to="{ name: 'Home' }">返回星球</RouterLink>
        <UserProfileDropdown theme="light" />
      </nav>
    </header>
    <main class="max-w-[1024px] mx-auto px-3 py-3 md:px-[1.2rem] md:py-[1.2rem]">
      <RouterView />
    </main>
  </div>
</template>
