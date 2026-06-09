<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import { useNotificationStore } from '@/stores/notifications'
import { checkUserSession } from '@/api/userAuth'

const notifStore = useNotificationStore()
const isOpen = ref(false)
const isLoggedIn = ref(false)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value && notifStore.unreadCount > 0) {
    notifStore.markAllRead()
  }
}

const closeDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.notif-container')) {
    isOpen.value = false
  }
}

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

onMounted(async () => {
  const user = await checkUserSession()
  isLoggedIn.value = !!user
  if (user) {
    notifStore.connect()
    notifStore.loadUnreadCount()
    notifStore.loadNotifications()
    document.addEventListener('click', closeDropdown)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div v-if="isLoggedIn" class="notif-container">
    <button class="notif-btn" @click.stop="toggleDropdown">
      <span class="bell-icon">🔔</span>
      <span v-if="notifStore.unreadCount > 0" class="badge">{{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}</span>
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown">
        <div class="dropdown-header">
          <span>通知</span>
          <span v-if="notifStore.isConnected" class="connected-dot" title="实时连接中"></span>
        </div>

        <div v-if="notifStore.notifications.length === 0" class="dropdown-empty">
          暂无通知
        </div>

        <div v-else class="dropdown-list">
          <div
            v-for="n in notifStore.notifications.slice(0, 20)"
            :key="n.id"
            class="notif-item"
            :class="{ unread: !n.isRead }"
          >
            <div class="notif-title">{{ n.title }}</div>
            <div v-if="n.content" class="notif-content">{{ n.content }}</div>
            <div class="notif-time">{{ formatTime(n.createdAt) }}</div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.notif-container {
  position: relative;
}

.notif-btn {
  position: relative;
  border: 1px solid rgba(163, 218, 255, 0.45);
  border-radius: 999px;
  background: rgba(4, 20, 48, 0.55);
  backdrop-filter: blur(8px);
  padding: 0.4rem 0.6rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 220ms ease;
}

.notif-btn:hover {
  border-color: rgba(188, 229, 255, 0.82);
  box-shadow: 0 0 16px rgba(123, 193, 255, 0.35);
}

.bell-icon {
  font-size: 0.9rem;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #ef4444;
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.dropdown {
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

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.connected-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
}

.dropdown-empty {
  padding: 2rem 1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.85rem;
}

.dropdown-list {
  max-height: 340px;
  overflow-y: auto;
  scrollbar-width: none;
}

.dropdown-list::-webkit-scrollbar {
  display: none;
}

.notif-item {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.15s ease;
}

.notif-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.notif-item.unread {
  background: rgba(100, 180, 255, 0.06);
}

.notif-title {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.4;
}

.notif-content {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 0.2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notif-time {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 0.25rem;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
