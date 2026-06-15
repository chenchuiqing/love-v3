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
  <div class="fixed inset-0 z-[9999] grid place-items-center bg-black/50 backdrop-blur-[4px]" @click.self="emit('close')">
    <div class="w-[min(340px,88vw)] p-6 rounded-2xl bg-[rgba(15,25,50,0.95)] border border-white/15 backdrop-blur-[20px] flex flex-col gap-4">
      <h3 class="m-0 text-[1.1rem] text-[rgba(255,255,255,0.95)] text-center">登录参与回忆对话</h3>

      <div class="flex gap-3">
        <button
          v-for="opt in options"
          :key="opt.id"
          type="button"
          class="flex-1 py-[0.65rem] border-2 border-white/20 rounded-[0.6rem] bg-white/5 text-[rgba(255,255,255,0.85)] text-[1rem] cursor-pointer transition-all duration-[0.2s] ease hover:border-white/40 hover:bg-white/10"
          :class="{ '!border-[rgba(100,180,255,0.7)] !bg-[rgba(100,180,255,0.15)] font-semibold': selectedUser?.id === opt.id }"
          @click="selectedUser = opt"
        >
          {{ opt.name }}
        </button>
      </div>

      <label v-if="selectedUser" class="grid gap-[0.35rem] text-[0.85rem] text-[rgba(255,255,255,0.7)]">
        {{ selectedUser.name }} 的密码
        <input v-model="password" type="password" autocomplete="current-password" class="border border-white/20 rounded-[0.5rem] py-2 px-[0.6rem] text-[0.95rem] bg-white/8 text-white focus:outline-none focus:border-[rgba(100,180,255,0.5)]" @keyup.enter="handleSubmit" />
      </label>

      <p v-if="errorMessage" class="m-0 text-[#ff6b6b] text-[0.85rem]">{{ errorMessage }}</p>

      <div class="flex justify-end gap-[0.6rem]">
        <button type="button" class="px-4 py-2 border border-white/20 rounded-[0.5rem] bg-transparent text-[rgba(255,255,255,0.7)] cursor-pointer" @click="emit('close')">取消</button>
        <button v-if="selectedUser" type="button" class="px-4 py-2 border-none rounded-[0.5rem] bg-[rgba(100,180,255,0.3)] text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed" :disabled="loading" @click="handleSubmit">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </div>
    </div>
  </div>
</template>

