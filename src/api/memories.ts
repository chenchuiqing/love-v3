import type { Memory } from '@/types/memory'

import { apiRequest } from './client'

interface MemoryListResponse {
  data: Memory[]
}

interface MemoryResponse {
  data: Memory
}

type CreateMemoryInput = Omit<Memory, 'id'>

interface UploadResponse {
  data: {
    url: string
    name: string
    size: number
    type: string
  }
}

export const fetchMemories = async (): Promise<Memory[]> => {
  const result = await apiRequest<MemoryListResponse>('/api/memories')
  return result.data
}

export const fetchPublishMemories = async (): Promise<Memory[]> => {
  const result = await apiRequest<MemoryListResponse>('/api/publish/memories')
  return result.data
}

export const fetchPublishMemoryById = async (id: string): Promise<Memory> => {
  const result = await apiRequest<MemoryResponse>(`/api/publish/memories/${id}`)
  return result.data
}

export const createPublishMemory = async (memory: CreateMemoryInput): Promise<Memory> => {
  const result = await apiRequest<MemoryResponse>('/api/publish/memories', {
    method: 'POST',
    body: JSON.stringify(memory),
  })
  return result.data
}

export const updatePublishMemory = async (id: string, memory: Partial<Memory>): Promise<Memory> => {
  const result = await apiRequest<MemoryResponse>(`/api/publish/memories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(memory),
  })
  return result.data
}

export const deletePublishMemory = async (id: string): Promise<void> => {
  await apiRequest<void>(`/api/publish/memories/${id}`, {
    method: 'DELETE',
  })
}

export const uploadPublishMedia = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/publish/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof payload?.message === 'string' ? payload.message : '上传失败'
    throw new Error(message)
  }

  return (payload as UploadResponse).data.url
}
