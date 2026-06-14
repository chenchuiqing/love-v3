<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { checkUserSession, getCachedUser, userLogout } from '@/api/userAuth'
import { useNotificationStore } from '@/stores/notifications'
import UserLoginDialog from './UserLoginDialog.vue'

withDefaults(defineProps<{
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

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
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
  <div class="upd-container" :class="[`upd-${theme}`]">
    <!-- Avatar 触发器 -->
    <button
      ref="avatarRef"
      class="upd-avatar"
      :class="{ 'upd-avatar--logged-in': isLoggedIn, 'upd-avatar--has-notif': isLoggedIn && notifStore.unreadCount > 0 }"
      @click.stop="togglePopover"
    >
      <span v-if="isLoggedIn" class="upd-avatar-char">{{ lastChar }}</span>
      <span v-else class="upd-avatar-guest" />
    </button>

    <!-- Popover 主菜单 -->
    <Transition name="upd-dropdown">
      <div
        v-if="isOpen && !showNotifications"
        ref="popoverRef"
        class="upd-popover"
      >
        <!-- 已登录 -->
        <template v-if="isLoggedIn">
          <div class="upd-user-info">
            {{ currentUser?.name ?? '' }}
          </div>
          <button class="upd-menu-item" @click="handleOpenNotifications">
            通知
            <span v-if="notifStore.unreadCount > 0" class="upd-badge">{{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}</span>
          </button>
          <button class="upd-menu-item" @click="handleGoToAdmin">
            管理后台
          </button>
          <button class="upd-menu-item upd-menu-item--danger" @click="handleLogout">
            退出登录
          </button>
        </template>

        <!-- 未登录 -->
        <template v-else>
          <button class="upd-menu-item" @click="handleLoginClick">
            登录
          </button>
        </template>
      </div>
    </Transition>

    <!-- 通知面板（独立弹窗） -->
    <Transition name="upd-dropdown">
      <div v-if="isOpen && showNotifications" class="upd-notif-panel">
        <div class="upd-notif-header">
          <button class="upd-notif-back" @click="handleBackFromNotifications">&larr;</button>
          <span>通知</span>
          <span class="upd-notif-header-spacer" />
          <button
            v-if="notifStore.unreadCount > 0"
            class="upd-notif-mark-all"
            @click="handleMarkAllRead"
          >
            全部已读
          </button>
          <span v-if="notifStore.isConnected" class="upd-connected-dot" />
        </div>

        <div v-if="notifStore.notifications.length === 0" class="upd-notif-empty">
          暂无通知
        </div>

        <div v-else class="upd-notif-list">
          <div
            v-for="n in notifStore.notifications.slice(0, 20)"
            :key="n.id"
            class="upd-notif-item"
            :class="{ 'upd-notif-item--unread': !n.isRead }"
            @click="handleNotificationClick(n)"
          >
            <div class="upd-notif-row1">
              <span v-if="!n.isRead" class="upd-notif-dot" />
              <div class="upd-notif-title">{{ n.title }}</div>
              <button class="upd-notif-delete" @click="handleDeleteNotification($event, n.id)">×</button>
            </div>
            <div v-if="n.content" class="upd-notif-content">{{ n.content }}</div>
            <div class="upd-notif-time">{{ formatTime(n.createdAt) }}</div>
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
.upd-container {
  position: relative;
}

/* ===== Avatar ===== */
.upd-avatar {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid rgba(163, 218, 255, 0.45);
  background: rgba(4, 20, 48, 0.55);
  backdrop-filter: blur(8px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 220ms ease;
  padding: 0;
  outline: none;
}

.upd-avatar:hover {
  border-color: rgba(188, 229, 255, 0.82);
  box-shadow: 0 0 16px rgba(123, 193, 255, 0.35);
  transform: translateY(-1px);
}

.upd-avatar-char {
  color: rgba(236, 247, 255, 0.95);
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1;
  user-select: none;
}

.upd-avatar-guest {
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(236, 247, 255, 0.25);
}

/* 未读通知角标 */
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

/* ===== Popover ===== */
.upd-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  border-radius: 0.65rem;
  background: rgba(10, 20, 45, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 10000;
  padding: 0.35rem 0;
}

.upd-user-info {
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.upd-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.55rem 1rem;
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.15s ease;
  text-align: left;
}

.upd-menu-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.upd-menu-item--danger {
  color: #ff6b6b;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.upd-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #ef4444;
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* ===== 通知面板 ===== */
.upd-notif-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 300px;
  max-height: 400px;
  border-radius: 0.75rem;
  background: rgba(10, 20, 45, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 10000;
}

.upd-notif-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.upd-notif-back {
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.15s ease;
}

.upd-notif-back:hover {
  color: rgba(255, 255, 255, 0.9);
}

.upd-connected-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  flex-shrink: 0;
}

.upd-notif-header-spacer {
  flex: 1;
}

.upd-notif-mark-all {
  border: none;
  background: none;
  color: rgba(100, 180, 255, 0.8);
  font-size: 0.72rem;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
}

.upd-notif-mark-all:hover {
  color: rgba(100, 180, 255, 1);
}

.upd-notif-empty {
  padding: 2rem 1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.85rem;
}

.upd-notif-list {
  max-height: 340px;
  overflow-y: auto;
  scrollbar-width: none;
}

.upd-notif-list::-webkit-scrollbar {
  display: none;
}

.upd-notif-item {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.15s ease;
}

.upd-notif-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.upd-notif-item--unread {
  background: rgba(100, 180, 255, 0.08);
}

.upd-notif-row1 {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.upd-notif-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3b82f6;
  flex-shrink: 0;
}

.upd-notif-delete {
  margin-left: auto;
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.25);
  font-size: 1rem;
  cursor: pointer;
  padding: 0 0.2rem;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.upd-notif-delete:hover {
  color: rgba(255, 100, 100, 0.8);
}

.upd-notif-title {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.4;
}

.upd-notif-content {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 0.2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upd-notif-time {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 0.25rem;
}

/* ===== 主题：light（管理后台） ===== */
.upd-light .upd-avatar {
  border-color: rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.9);
}

.upd-light .upd-avatar:hover {
  border-color: rgba(0, 0, 0, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.upd-light .upd-avatar-char {
  color: #1d2433;
}

.upd-light .upd-avatar-guest {
  background: rgba(0, 0, 0, 0.1);
}

.upd-light .upd-avatar--has-notif::after {
  border-color: #fff;
}

.upd-light .upd-popover,
.upd-light .upd-notif-panel {
  background: #fff;
  border-color: #d8deea;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.upd-light .upd-user-info {
  color: #1d2433;
  border-bottom-color: #e5e8f0;
}

.upd-light .upd-menu-item {
  color: #374151;
}

.upd-light .upd-menu-item:hover {
  background: #f3f4f6;
}

.upd-light .upd-menu-item--danger {
  color: #dc2626;
  border-top-color: #e5e8f0;
}

.upd-light .upd-notif-header {
  color: #1d2433;
  border-bottom-color: #e5e8f0;
}

.upd-light .upd-notif-back {
  color: #6b7280;
}

.upd-light .upd-notif-back:hover {
  color: #1d2433;
}

.upd-light .upd-notif-empty {
  color: #9ca3af;
}

.upd-light .upd-notif-item {
  border-bottom-color: #f3f4f6;
}

.upd-light .upd-notif-item:hover {
  background: #f9fafb;
}

.upd-light .upd-notif-item--unread {
  background: #eff6ff;
}

.upd-light .upd-notif-dot {
  background: #3b82f6;
}

.upd-light .upd-notif-delete {
  color: rgba(0, 0, 0, 0.2);
}

.upd-light .upd-notif-delete:hover {
  color: rgba(220, 38, 38, 0.7);
}

.upd-light .upd-notif-mark-all {
  color: rgba(37, 99, 235, 0.8);
}

.upd-light .upd-notif-mark-all:hover {
  color: rgba(37, 99, 235, 1);
}

.upd-light .upd-notif-title {
  color: #1d2433;
}

.upd-light .upd-notif-content {
  color: #6b7280;
}

.upd-light .upd-notif-time {
  color: #9ca3af;
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
</style>
