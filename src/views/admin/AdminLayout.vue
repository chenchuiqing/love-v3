<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { logoutAdmin } from '@/api/auth'

const route = useRoute()
const router = useRouter()

const pageTitle = computed(() => {
  if (route.name === 'AdminMemoryCreate') return '新建记忆点'
  if (route.name === 'AdminMemoryEdit') return '编辑记忆点'
  return '记忆点列表'
})

const handleLogout = async () => {
  await logoutAdmin()
  await router.push({ name: 'AdminLogin' })
}
</script>

<template>
  <div class="admin-layout">
    <header class="admin-header">
      <div>
        <p class="brand">记忆点后台</p>
        <h1 class="title">{{ pageTitle }}</h1>
      </div>
      <nav class="actions">
        <RouterLink class="link" :to="{ name: 'AdminMemoryList' }">列表</RouterLink>
        <RouterLink class="link" :to="{ name: 'AdminMemoryCreate' }">新增</RouterLink>
        <button class="logout" type="button" @click="handleLogout">退出登录</button>
      </nav>
    </header>
    <main class="admin-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f4f6fb;
  color: #1d2433;
}

.admin-header {
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

.logout {
  border: none;
  border-radius: 0.5rem;
  padding: 0.45rem 0.75rem;
  background: #243b76;
  color: #fff;
  cursor: pointer;
}

.admin-main {
  max-width: 1024px;
  margin: 0 auto;
  padding: 1.2rem;
}
</style>
