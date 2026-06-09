<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { Comment } from '@/types/memory'
import { fetchComments, createComment, deleteComment } from '@/api/comments'
import { checkUserSession, getCachedUser } from '@/api/userAuth'
import UserLoginDialog from './UserLoginDialog.vue'

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

const currentUser = () => getCachedUser()

const canDelete = (comment: Comment) => {
  const user = currentUser()
  return user && user.id === comment.userId
}

const displayName = (comment: { userId: string; userName: string }) => {
  const user = currentUser()
  return user && user.id === comment.userId ? '我' : comment.userName
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

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return date.toLocaleDateString('zh-CN')
}

onMounted(async () => {
  const user = await checkUserSession()
  isLoggedIn.value = !!user
  await loadComments()
})

defineExpose({ loadComments })
</script>

<template>
  <div class="comment-section">
    <div class="section-header">
      <span class="section-title">回忆对话</span>
      <span class="comment-count">{{ comments.length }} 条</span>
    </div>

    <div v-if="loading" class="loading-hint">加载中...</div>

    <div v-else-if="comments.length === 0" class="empty-hint">
      还没有评论，留下第一条回忆对话吧
    </div>

    <div v-else class="comment-list">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-head">
          <span class="author-tag" :class="comment.userId">{{ displayName(comment) }}</span>
          <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
          <button v-if="canDelete(comment)" class="delete-btn" @click="handleDelete(comment.id)">删除</button>
        </div>
        <p class="comment-content">{{ comment.content }}</p>
        <button class="reply-btn" @click="startReply(comment)">回复</button>

        <div v-if="comment.replies.length > 0" class="replies">
          <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
            <div class="comment-head">
              <span class="author-tag" :class="reply.userId">{{ displayName(reply) }}</span>
              <span class="comment-time">{{ formatTime(reply.createdAt) }}</span>
              <button v-if="canDelete(reply)" class="delete-btn" @click="handleDelete(reply.id)">删除</button>
            </div>
            <p class="comment-content">{{ reply.content }}</p>
          </div>
        </div>
      </div>
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
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
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

.comment-item {
  padding: 0.75rem;
  border-radius: 0.65rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.comment-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.author-tag {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 1rem;
}

.author-tag.party_a {
  background: rgba(236, 64, 122, 0.2);
  color: #ff80ab;
}

.author-tag.party_b {
  background: rgba(66, 165, 245, 0.2);
  color: #80d8ff;
}

.comment-time {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.35);
}

.delete-btn {
  margin-left: auto;
  font-size: 0.72rem;
  color: rgba(255, 100, 100, 0.6);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.delete-btn:hover {
  color: rgba(255, 100, 100, 1);
}

.comment-content {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  white-space: pre-line;
}

.reply-btn {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.2rem 0;
  margin-top: 0.25rem;
}

.reply-btn:hover {
  color: rgba(255, 255, 255, 0.7);
}

.replies {
  margin-top: 0.5rem;
  padding-left: 1rem;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reply-item {
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
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
</style>
