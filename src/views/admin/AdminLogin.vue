<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError } from '@/api/client'
import { loginAdmin } from '@/api/auth'

const route = useRoute()
const router = useRouter()

const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const redirectPath = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/admin') ? redirect : '/admin/memories'
})

const handleSubmit = async () => {
  if (!password.value) {
    errorMessage.value = '请输入密码'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    await loginAdmin(password.value)
    await router.replace(redirectPath.value)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      errorMessage.value = '密码错误'
    } else if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '登录失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <form class="login-card" @submit.prevent="handleSubmit">
      <h1>后台登录</h1>
      <p class="hint">仅管理员可访问记忆点管理功能</p>
      <label>
        管理密码
        <input v-model="password" type="password" autocomplete="current-password" />
      </label>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <button type="submit" :disabled="loading">
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

button {
  border: none;
  border-radius: 0.55rem;
  padding: 0.58rem 0.75rem;
  background: #243b76;
  color: #fff;
  cursor: pointer;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  margin: 0;
  color: #b72929;
  font-size: 0.9rem;
}
</style>
