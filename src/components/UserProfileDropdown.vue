<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { checkUserSession, getCachedUser, userLogout } from '@/api/userAuth'
import { useNotificationStore } from '@/stores/notifications'
import UserLoginDialog from './UserLoginDialog.vue'

const props = withDefaults(defineProps<{
  theme?: 'dark' | 'light'
}>(), {
  theme: 'dark',
})

const router = useRouter()
const notifStore = useNotificationStore()

const isLoggedIn = ref(false)
const isOpen = ref(false)
const showNotifications = ref(false)
const showLoginDialog = ref(false)
const popoverRef = ref<HTMLElement | null>(null)
const avatarRef = ref<HTMLElement | null>(null)

const currentUser = computed(() => getCachedUser())

const lastChar = computed(() => {
  if (!currentUser.value?.name) return ''
  return currentUser.value.name.slice(-1)
})

const isLight = computed(() => props.theme === 'light')

// 主题相关的 TailwindCSS 类
const avatarTheme = computed(() => isLight.value
  ? 'border-black/15 bg-white/90 hover:border-black/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]'
  : 'border-[rgba(163,218,255,0.45)] bg-[rgba(4,20,48,0.55)] backdrop-blur-lg hover:border-[rgba(188,229,255,0.82)] hover:shadow-[0_0_16px_rgba(123,193,255,0.35)]'
)

const avatarCharTheme = computed(() => isLight.value ? 'text-[#1d2433]' : 'text-[rgba(236,247,255,0.95)]')

const avatarGuestTheme = computed(() => isLight.value ? 'bg-black/10' : 'bg-[rgba(236,247,255,0.25)]')

const hasNotifBadge = computed(() => isLoggedIn.value && notifStore.unreadCount > 0)

const popoverTheme = computed(() => isLight.value
  ? 'bg-white border-[#d8deea] shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
  : 'bg-[rgba(10,20,45,0.95)] border-[rgba(255,255,255,0.12)] backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
)

const userInfoTheme = computed(() => isLight.value
  ? 'text-[#1d2433] border-[#e5e8f0]'
  : 'text-[rgba(255,255,255,0.9)] border-[rgba(255,255,255,0.08)]'
)

const menuItemTheme = computed(() => isLight.value
  ? 'text-[#374151] hover:bg-[#f3f4f6]'
  : 'text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.06)]'
)

const menuItemDangerTheme = computed(() => isLight.value
  ? 'text-[#dc2626] border-[#e5e8f0]'
  : 'text-[#ff6b6b] border-[rgba(255,255,255,0.06)]'
)

const notifHeaderTheme = computed(() => isLight.value
  ? 'text-[#1d2433] border-[#e5e8f0]'
  : 'text-[rgba(255,255,255,0.9)] border-[rgba(255,255,255,0.08)]'
)

const notifBackTheme = computed(() => isLight.value
  ? 'text-[#6b7280] hover:text-[#1d2433]'
  : 'text-[rgba(255,255,255,0.6)] hover:text-[rgba(255,255,255,0.9)]'
)

const notifEmptyTheme = computed(() => isLight.value ? 'text-[#9ca3af]' : 'text-[rgba(255,255,255,0.35)]')

const notifItemTheme = computed(() => isLight.value
  ? 'border-[#f3f4f6] hover:bg-[#f9fafb]'
  : 'border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.04)]'
)

const notifItemUnreadTheme = computed(() => isLight.value ? 'bg-[#eff6ff]' : 'bg-[rgba(100,180,255,0.08)]')

const notifDotTheme = computed(() => 'bg-[#3b82f6]')

const notifDeleteTheme = computed(() => isLight.value
  ? 'text-[rgba(0,0,0,0.2)] hover:text-[rgba(220,38,38,0.7)]'
  : 'text-[rgba(255,255,255,0.25)] hover:text-[rgba(255,100,100,0.8)]'
)

const notifMarkAllTheme = computed(() => isLight.value
  ? 'text-[rgba(37,99,235,0.8)] hover:text-[rgba(37,99,235,1)]'
  : 'text-[rgba(100,180,255,0.8)] hover:text-[rgba(100,180,255,1)]'
)

const notifTitleTheme = computed(() => isLight.value ? 'text-[#1d2433]' : 'text-[rgba(255,255,255,0.85)]')

const notifContentTheme = computed(() => isLight.value ? 'text-[#6b7280]' : 'text-[rgba(255,255,255,0.45)]')

const notifTimeTheme = computed(() => isLight.value ? 'text-[#9ca3af]' : 'text-[rgba(255,255,255,0.3)]')

const formatTime = (dateStr: string) => {
  // SQLite CURRENT_TIMESTAMP 返回无时区标记的 UTC 时间，追加 'Z' 修正时区
  const date = new Date(dateStr + 'Z')
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

const togglePopover = () => {
  if (isOpen.value) {
    isOpen.value = false
    showNotifications.value = false
  } else {
    isOpen.value = true
  }
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.upd-container')) {
    isOpen.value = false
    showNotifications.value = false
  }
}

const handleOpenNotifications = () => {
  showNotifications.value = true
}

const handleBackFromNotifications = () => {
  showNotifications.value = false
}

const handleGoToAdmin = () => {
  isOpen.value = false
  showNotifications.value = false
  router.push('/publish/memories')
}

const handleNotificationClick = (notification: { id: string; isRead: boolean; memoryId: string; commentId?: string | null }) => {
  // 单独标记已读
  if (!notification.isRead) {
    notifStore.markOneRead(notification.id)
  }

  isOpen.value = false
  showNotifications.value = false

  // 构建跳转 URL
  const query: Record<string, string> = { memoryId: notification.memoryId }
  if (notification.commentId) {
    query.commentId = notification.commentId
  }

  // 跳转到主页并传递参数
  router.push({ path: '/', query })
}

const handleDeleteNotification = (e: Event, id: string) => {
  e.stopPropagation()
  notifStore.deleteOne(id)
}

const handleMarkAllRead = () => {
  notifStore.markAllRead()
}

const handleLogout = async () => {
  notifStore.disconnect()
  await userLogout()
  isLoggedIn.value = false
  isOpen.value = false
  showNotifications.value = false
  await router.push('/')
}

const handleLoginClick = () => {
  isOpen.value = false
  showLoginDialog.value = true
}

const handleLoginSuccess = () => {
  showLoginDialog.value = false
  isLoggedIn.value = true
  notifStore.connect()
  notifStore.loadUnreadCount()
  notifStore.loadNotifications()
}

const initAuth = async () => {
  const user = await checkUserSession()
  isLoggedIn.value = !!user
  if (user) {
    notifStore.connect()
    notifStore.loadUnreadCount()
    notifStore.loadNotifications()
  }
}

onMounted(() => {
  initAuth()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="upd-container relative" :class="[isLight ? 'upd-light' : 'upd-dark']">
    <!-- Avatar 触发器 -->
    <button
      ref="avatarRef"
      class="relative w-9 h-9 rounded-full border-[1.5px] flex items-center justify-center cursor-pointer transition-all duration-[220ms] p-0 outline-none hover:-translate-y-px"
      :class="[avatarTheme, { 'upd-avatar--has-notif': hasNotifBadge }]"
      @click.stop="togglePopover"
    >
      <span v-if="isLoggedIn" class="text-[0.85rem] font-semibold leading-none select-none" :class="avatarCharTheme">{{ lastChar }}</span>
      <span v-else class="block w-[18px] h-[18px] rounded-full" :class="avatarGuestTheme" />
    </button>

    <!-- Popover 主菜单 -->
    <Transition name="upd-dropdown">
      <div
        v-if="isOpen && !showNotifications"
        ref="popoverRef"
        class="absolute top-[calc(100%+8px)] right-0 min-w-[180px] max-w-[calc(100vw-2rem)] rounded-[0.65rem] overflow-hidden z-[10000] py-[0.35rem]"
        :class="popoverTheme"
      >
        <!-- 已登录 -->
        <template v-if="isLoggedIn">
          <div class="px-4 py-[0.6rem] text-[0.85rem] font-semibold border-b" :class="userInfoTheme">
            {{ currentUser?.name ?? '' }}
          </div>
          <button class="flex items-center justify-between w-full px-4 py-[0.55rem] border-none bg-transparent text-[0.82rem] cursor-pointer transition-[background] duration-[0.15s] text-left" :class="menuItemTheme" @click="handleOpenNotifications">
            通知
            <span v-if="notifStore.unreadCount > 0" class="min-w-[18px] h-[18px] px-[5px] rounded-[9px] bg-[#ef4444] text-white text-[0.65rem] font-semibold flex items-center justify-center leading-none">{{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}</span>
          </button>
          <button class="flex items-center justify-between w-full px-4 py-[0.55rem] border-none bg-transparent text-[0.82rem] cursor-pointer transition-[background] duration-[0.15s] text-left" :class="menuItemTheme" @click="handleGoToAdmin">
            管理后台
          </button>
          <button class="flex items-center justify-between w-full px-4 py-[0.55rem] border-none bg-transparent text-[0.82rem] cursor-pointer transition-[background] duration-[0.15s] text-left border-t" :class="menuItemDangerTheme" @click="handleLogout">
            退出登录
          </button>
        </template>

        <!-- 未登录 -->
        <template v-else>
          <button class="flex items-center justify-between w-full px-4 py-[0.55rem] border-none bg-transparent text-[0.82rem] cursor-pointer transition-[background] duration-[0.15s] text-left" :class="menuItemTheme" @click="handleLoginClick">
            登录
          </button>
        </template>
      </div>
    </Transition>

    <!-- 通知面板（独立弹窗） -->
    <Transition name="upd-dropdown">
      <div v-if="isOpen && showNotifications" class="absolute top-[calc(100%+8px)] right-0 w-[300px] max-w-[calc(100vw-2rem)] max-h-[400px] rounded-[0.75rem] overflow-hidden z-[10000] flex flex-col" :class="popoverTheme">
        <div class="flex items-center gap-2 px-4 py-3 border-b text-[0.85rem] font-semibold" :class="notifHeaderTheme">
          <button class="border-none bg-transparent text-[1rem] cursor-pointer p-0 leading-none transition-[color] duration-[0.15s]" :class="notifBackTheme" @click="handleBackFromNotifications">&larr;</button>
          <span>通知</span>
          <span class="flex-1" />
          <button
            v-if="notifStore.unreadCount > 0"
            class="border-none bg-transparent text-[0.72rem] cursor-pointer p-0 whitespace-nowrap"
            :class="notifMarkAllTheme"
            @click="handleMarkAllRead"
          >
            全部已读
          </button>
          <span v-if="notifStore.isConnected" class="w-[6px] h-[6px] rounded-full bg-[#4ade80] flex-shrink-0" />
        </div>

        <div v-if="notifStore.notifications.length === 0" class="py-8 px-4 text-center text-[0.85rem]" :class="notifEmptyTheme">
          暂无通知
        </div>

        <div v-else class="max-h-[340px] overflow-y-auto scrollbar-none">
          <div
            v-for="n in notifStore.notifications.slice(0, 20)"
            :key="n.id"
            class="px-4 py-[0.65rem] border-b cursor-pointer transition-[background] duration-[0.15s]"
            :class="[notifItemTheme, { [notifItemUnreadTheme]: !n.isRead }]"
            @click="handleNotificationClick(n)"
          >
            <div class="flex items-center gap-[0.35rem]">
              <span v-if="!n.isRead" class="w-[6px] h-[6px] rounded-full flex-shrink-0" :class="notifDotTheme" />
              <div class="text-[0.82rem] leading-[1.4]" :class="notifTitleTheme">{{ n.title }}</div>
              <button class="ml-auto border-none bg-transparent text-[1rem] cursor-pointer px-[0.2rem] leading-none flex-shrink-0 transition-[color] duration-[0.15s]" :class="notifDeleteTheme" @click="handleDeleteNotification($event, n.id)">×</button>
            </div>
            <div v-if="n.content" class="text-[0.75rem] mt-[0.2rem] overflow-hidden text-ellipsis whitespace-nowrap" :class="notifContentTheme">{{ n.content }}</div>
            <div class="text-[0.7rem] mt-[0.25rem]" :class="notifTimeTheme">{{ formatTime(n.createdAt) }}</div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 登录弹窗 -->
    <UserLoginDialog
      v-if="showLoginDialog"
      @close="showLoginDialog = false"
      @login-success="handleLoginSuccess"
    />
  </div>
</template>

<style scoped>
/* ===== 通知角标 ===== */
.upd-avatar--has-notif::after {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  border: 1.5px solid rgba(4, 20, 48, 0.8);
}

.upd-light .upd-avatar--has-notif::after {
  border-color: #fff;
}

/* ===== 动画 ===== */
.upd-dropdown-enter-active,
.upd-dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.upd-dropdown-enter-from,
.upd-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 隐藏滚动条（Tailwind 不原生支持 webkit scrollbar） */
.scrollbar-none {
  scrollbar-width: none;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
