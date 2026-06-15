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
const showPassword = ref(false)

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
    const target = typeof redirect === 'string' && redirect.length > 0 ? redirect : '/'
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
  <div class="fixed inset-0 bg-[#000010] flex items-center justify-center overflow-hidden">
    <!-- Starfield background -->
    <div class="absolute inset-0 pointer-events-none">
      <div
        v-for="i in 60"
        :key="i"
        class="absolute rounded-full bg-white"
        :style="{
          width: `${Math.random() * 2.5 + 0.5}px`,
          height: `${Math.random() * 2.5 + 0.5}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity: Math.random() * 0.7 + 0.3,
          animationDelay: `${Math.random() * 3}s`,
        }"
      />
    </div>

    <!-- Ambient glow -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(100,160,240,0.12)_0%,transparent_70%)] pointer-events-none" />

    <!-- Login card -->
    <div class="relative z-10 w-[min(400px,90vw)] bg-[rgba(8,18,40,0.85)] border border-white/[0.08] rounded-2xl p-8 md:p-10 backdrop-blur-2xl shadow-[0_0_80px_rgba(60,130,220,0.08)]">
      <!-- Title -->
      <div class="text-center mb-8">
        <h1 class="text-2xl md:text-[1.65rem] font-semibold text-white/95 m-0 mb-2 tracking-wide">
          我们的星球
        </h1>
        <p class="text-sm text-white/40 m-0">
          选择你的身份，进入属于我们的记忆
        </p>
      </div>

      <!-- User selection -->
      <div v-if="options.length > 0" class="grid grid-cols-2 gap-3 mb-6">
        <button
          v-for="opt in options"
          :key="opt.id"
          type="button"
          class="relative py-4 px-4 rounded-xl border text-base font-medium transition-all duration-300 cursor-pointer"
          :class="selectedUser?.id === opt.id
            ? 'border-[rgba(120,180,255,0.5)] bg-[rgba(100,160,240,0.12)] text-white shadow-[0_0_24px_rgba(100,160,240,0.15)]'
            : 'border-white/[0.08] bg-white/[0.03] text-white/55 hover:border-white/[0.18] hover:bg-white/[0.06] hover:text-white/75'"
          @click="selectedUser = opt; errorMessage = ''"
        >
          <span class="block text-[1.35rem] mb-1">{{ opt.name }}</span>
          <span class="block text-[0.7rem] opacity-50 font-normal">点击选择</span>
        </button>
      </div>

      <div v-else-if="!errorMessage" class="text-center py-6 text-white/30 text-sm">
        加载用户列表中...
      </div>

      <!-- Password input -->
      <Transition name="slide">
        <div v-if="selectedUser" class="flex flex-col gap-4">
          <div class="relative">
            <label class="block text-xs text-white/40 mb-2 tracking-wide uppercase">
              {{ selectedUser.name }} 的密码
            </label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="请输入密码"
                class="w-full bg-white/[0.06] border border-white/[0.10] rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[rgba(120,180,255,0.45)] focus:bg-white/[0.08] transition-all duration-300 pr-11"
                @keyup.enter="handleSubmit"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors cursor-pointer p-1"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Error message -->
          <p v-if="errorMessage" class="text-sm text-[#ff6b6b] m-0 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ errorMessage }}
          </p>

          <!-- Submit button -->
          <button
            type="button"
            class="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            :class="loading
              ? 'bg-[rgba(100,160,240,0.2)]'
              : 'bg-[rgba(100,160,240,0.25)] hover:bg-[rgba(100,160,240,0.35)] shadow-[0_0_24px_rgba(100,160,240,0.12)]'"
            :disabled="loading"
            @click="handleSubmit"
          >
            {{ loading ? '登录中...' : '进入星球' }}
          </button>
        </div>
      </Transition>

      <!-- Bottom hint -->
      <p class="text-center text-xs text-white/15 mt-6 m-0">
        仅属于我们的秘密星球
      </p>
    </div>
  </div>
</template>

<style>
.slide-enter-active {
  transition: all 0.4s ease-out;
}
.slide-leave-active {
  transition: all 0.25s ease-in;
}
.slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.slide-leave-to {
  opacity: 0;
}
</style>
