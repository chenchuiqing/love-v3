import type { Memory } from '@/types/memory'

import { apiRequest } from './client'

interface MemoryListResponse {
  data: Memory[]
}

interface MemoryResponse {
  data: Memory
}

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

export const fetchAdminMemories = async (): Promise<Memory[]> => {
  const result = await apiRequest<MemoryListResponse>('/api/admin/memories')
  return result.data
}

export const fetchAdminMemoryById = async (id: string): Promise<Memory> => {
  const result = await apiRequest<MemoryResponse>(`/api/admin/memories/${id}`)
  return result.data
}

export const createAdminMemory = async (memory: Memory): Promise<Memory> => {
  const result = await apiRequest<MemoryResponse>('/api/admin/memories', {
    method: 'POST',
    body: JSON.stringify(memory),
  })
  return result.data
}

export const updateAdminMemory = async (id: string, memory: Partial<Memory>): Promise<Memory> => {
  const result = await apiRequest<MemoryResponse>(`/api/admin/memories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(memory),
  })
  return result.data
}

export const deleteAdminMemory = async (id: string): Promise<void> => {
  await apiRequest<void>(`/api/admin/memories/${id}`, {
    method: 'DELETE',
  })
}

export const uploadAdminMedia = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/admin/upload', {
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
