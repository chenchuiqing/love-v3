import type { AppNotification } from '@/types/memory'

import { apiRequest } from './client'

interface NotificationListResponse {
  data: AppNotification[]
}

interface UnreadCountResponse {
  data: { count: number }
}

export const fetchNotifications = async (): Promise<AppNotification[]> => {
  const result = await apiRequest<NotificationListResponse>('/api/notifications')
  return result.data
}

export const fetchUnreadCount = async (): Promise<number> => {
  const result = await apiRequest<UnreadCountResponse>('/api/notifications/unread-count')
  return result.data.count
}

export const markAllNotificationsRead = async (): Promise<void> => {
  await apiRequest<{ data: { updated: number } }>('/api/notifications/read-all', {
    method: 'PUT',
  })
}

export const markNotificationRead = async (id: string): Promise<void> => {
  await apiRequest<{ data: { ok: true } }>(`/api/notifications/${id}/read`, {
    method: 'PUT',
  })
}
