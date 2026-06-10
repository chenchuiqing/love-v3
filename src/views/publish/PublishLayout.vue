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
  <div class="publish-layout">
    <header class="publish-header">
      <div>
        <p class="brand">记忆点管理</p>
        <h1 class="title">{{ pageTitle }}</h1>
      </div>
      <nav class="actions">
        <RouterLink class="link" :to="{ name: 'PublishMemoryList' }">列表</RouterLink>
        <RouterLink class="link" :to="{ name: 'PublishMemoryCreate' }">新增</RouterLink>
        <UserProfileDropdown theme="light" />
      </nav>
    </header>
    <main class="publish-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.publish-layout {
  min-height: 100vh;
  background: #f4f6fb;
  color: #1d2433;
}

.publish-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #d8deea;
  background: #ffffff;
}

.brand {
  margin: 0;
  color: #5a6377;
  font-size: 0.85rem;
}

.title {
  margin: 0.2rem 0 0;
  font-size: 1.2rem;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.link {
  color: #304f9f;
  text-decoration: none;
  font-weight: 500;
}

.publish-main {
  max-width: 1024px;
  margin: 0 auto;
  padding: 1.2rem;
}

@media (max-width: 768px) {
  .publish-header {
    flex-wrap: wrap;
    padding: 0.75rem 1rem;
  }

  .actions {
    gap: 0.5rem;
  }

  .link {
    font-size: 0.88rem;
  }

  .publish-main {
    padding: 0.75rem;
  }
}
</style>
