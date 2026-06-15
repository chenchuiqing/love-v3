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
  <div class="min-h-screen grid place-items-center bg-[radial-gradient(circle_at_top,#2d3f6f_0%,#0b1022_60%)]">
    <form class="w-[min(360px,92vw)] p-[1.4rem] rounded-[0.85rem] bg-[rgba(255,255,255,0.96)] flex flex-col gap-[0.85rem]" @submit.prevent="handleSubmit">
      <h1 class="m-0 text-[1.3rem]">发布管理</h1>
      <p class="m-0 text-[#57607a] text-[0.9rem]">选择你的身份并输入密码</p>

      <div class="flex gap-3">
        <button
          v-for="opt in options"
          :key="opt.id"
          type="button"
          class="flex-1 py-3 border-2 border-[#d0d7e8] rounded-[0.6rem] bg-white text-[1rem] cursor-pointer transition-all duration-[0.2s] ease hover:border-[#5a7ec4]"
          :class="{ '!border-[#243b76] !bg-[#eef3fe] font-semibold': selectedUser?.id === opt.id }"
          @click="selectedUser = opt"
        >
          {{ opt.name }}
        </button>
      </div>

      <label v-if="selectedUser" class="grid gap-[0.4rem] text-[0.92rem]">
        {{ selectedUser.name }} 的密码
        <input v-model="password" type="password" autocomplete="current-password" class="border border-[#cfd6e6] rounded-[0.55rem] py-[0.55rem] px-[0.65rem] text-[1rem]" />
      </label>

      <p v-if="errorMessage" class="m-0 text-[#b72929] text-[0.9rem]">{{ errorMessage }}</p>
      <button v-if="selectedUser" type="submit" class="border-none rounded-[0.55rem] py-[0.58rem] px-3 bg-[#243b76] text-white cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
  </div>
</template>

