import type { Comment } from '@/types/memory'

import { apiRequest } from './client'

interface CommentListResponse {
  data: Comment[]
}

interface CommentResponse {
  data: Comment
}

export const fetchComments = async (memoryId: string): Promise<Comment[]> => {
  const result = await apiRequest<CommentListResponse>(`/api/memories/${memoryId}/comments`)
  return result.data
}

export const createComment = async (
  memoryId: string,
  data: { content: string; parentId?: string },
): Promise<Comment> => {
  const result = await apiRequest<CommentResponse>(`/api/memories/${memoryId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return result.data
}

export const deleteComment = async (commentId: string): Promise<void> => {
  await apiRequest<void>(`/api/comments/${commentId}`, {
    method: 'DELETE',
  })
}
