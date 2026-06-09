<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { ApiError } from '@/api/client'
import { getUserOptions, userLogin } from '@/api/userAuth'

interface UserOption {
  id: string
  name: string
}

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'login-success'): void
}>()

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
    emit('login-success')
    emit('close')
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
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog-card">
      <h3 class="dialog-title">登录参与回忆对话</h3>

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

      <label v-if="selectedUser" class="password-label">
        {{ selectedUser.name }} 的密码
        <input v-model="password" type="password" autocomplete="current-password" @keyup.enter="handleSubmit" />
      </label>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <div class="dialog-actions">
        <button type="button" class="cancel-btn" @click="emit('close')">取消</button>
        <button v-if="selectedUser" type="button" class="submit-btn" :disabled="loading" @click="handleSubmit">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.dialog-card {
  width: min(340px, 88vw);
  padding: 1.5rem;
  border-radius: 1rem;
  background: rgba(15, 25, 50, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dialog-title {
  margin: 0;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.95);
  text-align: center;
}

.user-options {
  display: flex;
  gap: 0.75rem;
}

.user-btn {
  flex: 1;
  padding: 0.65rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.85);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.1);
}

.user-btn.active {
  border-color: rgba(100, 180, 255, 0.7);
  background: rgba(100, 180, 255, 0.15);
  font-weight: 600;
}

.password-label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.password-label input {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem 0.6rem;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.password-label input:focus {
  outline: none;
  border-color: rgba(100, 180, 255, 0.5);
}

.error {
  margin: 0;
  color: #ff6b6b;
  font-size: 0.85rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}

.submit-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: rgba(100, 180, 255, 0.3);
  color: white;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
