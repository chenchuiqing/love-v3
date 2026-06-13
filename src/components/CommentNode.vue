<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Comment } from '@/types/memory'

interface FlatReplyItem {
  comment: Comment
  replyToName: string
}

const MAX_VISIBLE = 3

const props = defineProps<{
  comment: Comment
  depth: number
  currentUserId: string | null
  parentUserName?: string
}>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
  (e: 'reply', comment: Comment): void
}>()

const isExpanded = ref(false)

const displayName = (comment: { userId: string; userName: string }) => {
  return props.currentUserId && props.currentUserId === comment.userId ? '我' : comment.userName
}

const canDelete = (comment: Comment) => {
  return props.currentUserId && props.currentUserId === comment.userId
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

/** 递归拍平所有后代回复，并为每条记录被回复者名字 */
const flattenReplies = (replies: Comment[], parentName: string): FlatReplyItem[] => {
  const result: FlatReplyItem[] = []
  for (const reply of replies) {
    result.push({ comment: reply, replyToName: parentName })
    if (reply.replies.length > 0) {
      result.push(...flattenReplies(reply.replies, reply.userName))
    }
  }
  return result
}

const flatReplies = computed(() => {
  if (props.depth > 0) return []
  return flattenReplies(props.comment.replies, props.comment.userName)
})

const visibleFlatReplies = computed(() => {
  if (isExpanded.value) return flatReplies.value
  return flatReplies.value.slice(0, MAX_VISIBLE)
})

const hiddenCount = computed(() => Math.max(0, flatReplies.value.length - MAX_VISIBLE))

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div :id="`comment-${comment.id}`" class="comment-item" :class="{ 'is-reply': depth > 0 }">
    <div class="comment-head">
      <span class="author-tag" :class="comment.userId">{{ displayName(comment) }}</span>
      <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
      <button v-if="canDelete(comment)" class="delete-btn" @click="emit('delete', comment.id)">删除</button>
    </div>

    <p class="comment-content">
      <span v-if="depth > 0 && parentUserName" class="reply-to">
        回复 <b>@{{ parentUserName }}</b>：
      </span>{{ comment.content }}
    </p>

    <button class="reply-btn" @click="emit('reply', comment)">回复</button>

    <!-- 仅一级评论平铺所有后代回复 -->
    <template v-if="depth === 0">
      <div v-if="flatReplies.length > 0" class="replies">
        <CommentNode
          v-for="item in visibleFlatReplies"
          :key="item.comment.id"
          :comment="item.comment"
          :depth="1"
          :current-user-id="currentUserId"
          :parent-user-name="item.replyToName"
          @delete="(id: string) => emit('delete', id)"
          @reply="(c: Comment) => emit('reply', c)"
        />

        <button v-if="hiddenCount > 0 && !isExpanded" class="expand-btn" @click="toggleExpand">
          展开剩余 {{ hiddenCount }} 条回复 ▾
        </button>
        <button v-else-if="isExpanded && flatReplies.length > MAX_VISIBLE" class="expand-btn" @click="toggleExpand">
          收起 ▴
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.comment-item {
  padding: 0.75rem;
  border-radius: 0.65rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.comment-item.is-reply {
  background: rgba(255, 255, 255, 0.03);
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 0.65rem;
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

.reply-to {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.82rem;
}

.reply-to b {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
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
  gap: 0.4rem;
}

.expand-btn {
  font-size: 0.75rem;
  color: rgba(100, 180, 255, 0.7);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.3rem 0;
  text-align: left;
  margin-top: 0.15rem;
}

.expand-btn:hover {
  color: rgba(100, 180, 255, 1);
}
</style>
