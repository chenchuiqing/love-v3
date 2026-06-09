<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError } from '@/api/client'
import { getUserOptions, userLogin } from '@/api/userAuth'

interface UserOption {
  id: string
  name: string
}

const route = useRoute()
const router = useRouter()

const options = ref<UserOption[]>([])
const selectedUser = ref<UserOption | null>(null)
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  try {
    options.value = await getUserOptions()
  } catch {
    errorMessage.value = '获取用户列表失败'
  }
})

const handleSubmit = async () => {
  if (!selectedUser.value) {
    errorMessage.value = '请选择身份'
    return
  }
  if (!password.value) {
    errorMessage.value = '请输入密码'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    await userLogin(selectedUser.value.name, password.value)
    const redirect = route.query.redirect
    const target = typeof redirect === 'string' && redirect.startsWith('/publish') ? redirect : '/publish/memories'
    await router.replace(target)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      errorMessage.value = '密码错误'
    } else if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '登录失败'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <form class="login-card" @submit.prevent="handleSubmit">
      <h1>发布管理</h1>
      <p class="hint">选择你的身份并输入密码</p>

      <div class="user-options">
        <button
          v-for="opt in options"
          :key="opt.id"
          type="button"
          class="user-btn"
          :class="{ active: selectedUser?.id === opt.id }"
          @click="selectedUser = opt"
        >
          {{ opt.name }}
        </button>
      </div>

      <label v-if="selectedUser">
        {{ selectedUser.name }} 的密码
        <input v-model="password" type="password" autocomplete="current-password" />
      </label>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <button v-if="selectedUser" type="submit" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at top, #2d3f6f 0%, #0b1022 60%);
}

.login-card {
  width: min(360px, 92vw);
  padding: 1.4rem;
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.96);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.login-card h1 {
  margin: 0;
  font-size: 1.3rem;
}

.hint {
  margin: 0;
  color: #57607a;
  font-size: 0.9rem;
}

.user-options {
  display: flex;
  gap: 0.75rem;
}

.user-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #d0d7e8;
  border-radius: 0.6rem;
  background: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-btn:hover {
  border-color: #5a7ec4;
}

.user-btn.active {
  border-color: #243b76;
  background: #eef3fe;
  font-weight: 600;
}

label {
  display: grid;
  gap: 0.4rem;
  font-size: 0.92rem;
}

input {
  border: 1px solid #cfd6e6;
  border-radius: 0.55rem;
  padding: 0.55rem 0.65rem;
  font-size: 1rem;
}

button[type='submit'] {
  border: none;
  border-radius: 0.55rem;
  padding: 0.58rem 0.75rem;
  background: #243b76;
  color: #fff;
  cursor: pointer;
}

button[type='submit']:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  margin: 0;
  color: #b72929;
  font-size: 0.9rem;
}
</style>
