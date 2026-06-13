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
const isCollapsed = ref(false)

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
  <div class="comment-section">
    <button class="section-header" @click="toggleCollapse">
      <span class="collapse-arrow" :class="{ collapsed: isCollapsed }">▾</span>
      <span class="section-title">回忆对话</span>
      <span class="comment-count">{{ comments.length }} 条</span>
    </button>

    <div v-if="!isCollapsed" class="section-body">

    <div v-if="loading" class="loading-hint">加载中...</div>

    <div v-else-if="comments.length === 0" class="empty-hint">
      还没有评论，留下第一条回忆对话吧
    </div>

    <div v-else class="comment-list">
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

    <div v-if="replyTarget" class="reply-indicator">
      回复 {{ displayName(replyTarget) }}：
      <span class="reply-preview">{{ replyTarget.content.slice(0, 30) }}{{ replyTarget.content.length > 30 ? '...' : '' }}</span>
      <button class="cancel-reply" @click="cancelReply">取消</button>
    </div>

    <div v-if="isLoggedIn" class="input-area">
      <textarea
        v-model="inputText"
        class="comment-input"
        :placeholder="replyTarget ? '写下回复...' : '写下你的回忆对话...'"
        rows="2"
        @keydown.ctrl.enter="handleSubmit"
      ></textarea>
      <button class="send-btn" :disabled="!inputText.trim() || submitting" @click="handleSubmit">
        {{ submitting ? '发送中...' : '发送' }}
      </button>
    </div>

    <div v-else class="login-prompt">
      <button class="login-btn" @click="showLoginDialog = true">登录后参与回忆对话</button>
    </div>

    <UserLoginDialog
      v-if="showLoginDialog"
      @close="showLoginDialog = false"
      @login-success="handleLoginSuccess"
    />
    </div>
  </div>
</template>

<style scoped>
.comment-section {
  width: 100%;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  font-family: inherit;
}

.section-header:hover .section-title {
  color: rgba(255, 255, 255, 1);
}

.collapse-arrow {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  transition: transform 0.25s ease;
  line-height: 1;
}

.collapse-arrow.collapsed {
  transform: rotate(-90deg);
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  transition: color 0.2s ease;
}

.comment-count {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.loading-hint,
.empty-hint {
  text-align: center;
  padding: 1.5rem 0;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 40vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.comment-list::-webkit-scrollbar {
  display: none;
}

.reply-indicator {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.reply-preview {
  color: rgba(255, 255, 255, 0.35);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cancel-reply {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.input-area {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  align-items: flex-end;
}

.comment-input {
  flex: 1;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.5rem;
  padding: 0.5rem 0.6rem;
  font-size: 0.85rem;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.06);
  color: white;
  resize: none;
}

.comment-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.3);
}

.comment-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.send-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: rgba(100, 180, 255, 0.25);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.login-prompt {
  text-align: center;
  margin-top: 0.75rem;
}

.login-btn {
  padding: 0.6rem 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.login-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.35);
  color: rgba(255, 255, 255, 0.9);
}

/* 评论高亮效果 */
:global(.comment-highlight) {
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
