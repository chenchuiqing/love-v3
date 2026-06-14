import { apiRequest } from './client';
export const fetchNotifications = async () => {
    const result = await apiRequest('/api/notifications');
    return result.data;
};
export const fetchUnreadCount = async () => {
    const result = await apiRequest('/api/notifications/unread-count');
    return result.data.count;
};
export const markAllNotificationsRead = async () => {
    await apiRequest('/api/notifications/read-all', {
        method: 'PUT',
    });
};
export const markNotificationRead = async (id) => {
    await apiRequest(`/api/notifications/${id}/read`, {
        method: 'PUT',
    });
};
export const deleteNotification = async (id) => {
    await apiRequest(`/api/notifications/${id}`, {
        method: 'DELETE',
    });
};
