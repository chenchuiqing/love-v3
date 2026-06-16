<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import type { Comment } from '@/types/memory'
import { fetchComments, createComment, deleteComment } from '@/api/comments'
import { checkUserSession, getCachedUser } from '@/api/userAuth'
import UserLoginDialog from './UserLoginDialog.vue'
import CommentNode from './CommentNode.vue'

const props = defineProps<{
  memoryId: string
}>()

const comments = ref<Comment[]>([])
const loading = ref(false)
const inputText = ref('')
const replyTarget = ref<Comment | null>(null)
const submitting = ref(false)
const isLoggedIn = ref(false)
const showLoginDialog = ref(false)
const isCollapsed = ref(true)

const currentUserId = computed(() => getCachedUser()?.id ?? null)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const expand = () => {
  isCollapsed.value = false
}

const loadComments = async () => {
  loading.value = true
  try {
    comments.value = await fetchComments(props.memoryId)
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

const displayName = (comment: { userId: string; userName: string }) => {
  return currentUserId.value && currentUserId.value === comment.userId ? '我' : comment.userName
}

const startReply = (comment: Comment) => {
  if (!isLoggedIn.value) {
    showLoginDialog.value = true
    return
  }
  replyTarget.value = comment
  inputText.value = ''
}

const cancelReply = () => {
  replyTarget.value = null
}

const handleSubmit = async () => {
  if (!inputText.value.trim() || submitting.value) return

  if (!isLoggedIn.value) {
    showLoginDialog.value = true
    return
  }

  submitting.value = true
  try {
    await createComment(props.memoryId, {
      content: inputText.value.trim(),
      parentId: replyTarget.value?.id,
    })
    inputText.value = ''
    replyTarget.value = null
    await loadComments()
  } catch {
    // ignore
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: string) => {
  try {
    await deleteComment(id)
    await loadComments()
  } catch {
    // ignore
  }
}

const handleLoginSuccess = () => {
  isLoggedIn.value = true
  showLoginDialog.value = false
}

onMounted(async () => {
  const user = await checkUserSession()
  isLoggedIn.value = !!user
  await loadComments()
})

defineExpose({ loadComments, isCollapsed, expand })
</script>

<template>
  <div class="w-full pt-4 border-t border-white/10">
    <button
      class="flex items-center gap-1.5 mb-3 w-full p-0 border-none bg-transparent text-inherit cursor-pointer font-inherit group"
      @click="toggleCollapse"
    >
      <span
        class="text-xs text-white/40 leading-none transition-transform duration-250 ease-out"
        :class="{ 'rotate-[-90deg]': isCollapsed }"
      >▾</span>
      <span class="text-[0.95rem] font-semibold text-white/90 group-hover:text-white transition-colors duration-200">
        回忆对话
      </span>
      <span class="text-xs text-white/50">{{ comments.length }} 条</span>
    </button>

    <div v-if="!isCollapsed" class="flex flex-col gap-3">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-6 text-white/40 text-[0.85rem]">
        加载中...
      </div>

      <!-- Empty -->
      <div v-else-if="comments.length === 0" class="text-center py-6 text-white/40 text-[0.85rem]">
        还没有评论，留下第一条回忆对话吧
      </div>

      <!-- Comment List -->
      <div v-else class="flex flex-col gap-3 max-h-[40vh] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CommentNode
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          :depth="0"
          :current-user-id="currentUserId"
          @delete="handleDelete"
          @reply="startReply"
        />
      </div>

      <!-- Reply Indicator -->
      <div v-if="replyTarget" class="flex items-center gap-1.5 py-2 text-xs text-white/50">
        回复 {{ displayName(replyTarget) }}：
        <span class="text-white/35 max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
          {{ replyTarget.content.slice(0, 30) }}{{ replyTarget.content.length > 30 ? '...' : '' }}
        </span>
        <button class="text-xs text-white/40 bg-transparent border-none cursor-pointer p-0" @click="cancelReply">
          取消
        </button>
      </div>

      <!-- Input Area (logged in) -->
      <div v-if="isLoggedIn" class="flex gap-2 mt-3 items-end">
        <textarea
          v-model="inputText"
          class="flex-1 border border-white/15 rounded-lg px-2.5 py-2 text-base text-white bg-white/[0.06] resize-y min-h-[56px] font-inherit placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors [scrollbar-width:thin] [scrollbar-color:rgb(255,255,255,0.12)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/12 hover:[&::-webkit-scrollbar-thumb]:bg-white/20"
          :placeholder="replyTarget ? '写下回复...' : '写下你的回忆对话...'"
          rows="2"
          @keydown.ctrl.enter="handleSubmit"
        ></textarea>
        <button
          class="px-4 py-2 border-none rounded-lg bg-white/[0.15] text-white/90 text-[0.85rem] cursor-pointer whitespace-nowrap font-inherit transition-colors hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!inputText.trim() || submitting"
          @click="handleSubmit"
        >
          {{ submitting ? '发送中...' : '发送' }}
        </button>
      </div>

      <!-- Login Prompt -->
      <div v-else class="text-center mt-3">
        <button
          class="px-5 py-2.5 border border-white/20 rounded-lg bg-white/[0.06] text-white/70 text-[0.85rem] cursor-pointer font-inherit transition-all duration-200 hover:bg-white/10 hover:border-white/35 hover:text-white/90"
          @click="showLoginDialog = true"
        >
          登录后参与回忆对话
        </button>
      </div>

      <UserLoginDialog
        v-if="showLoginDialog"
        @close="showLoginDialog = false"
        @login-success="handleLoginSuccess"
      />
    </div>
  </div>
</template>

<style>
.comment-highlight {
  animation: highlight-fade 3s ease-out;
}

@keyframes highlight-fade {
  0% {
    background-color: rgba(100, 180, 255, 0.3);
    box-shadow: 0 0 20px rgba(100, 180, 255, 0.5);
  }
  100% {
    background-color: transparent;
    box-shadow: none;
  }
}
</style>
