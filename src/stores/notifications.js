import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { deleteNotification, fetchNotifications, fetchUnreadCount, markAllNotificationsRead, markNotificationRead } from '@/api/notifications';
export const useNotificationStore = defineStore('notifications', () => {
    const unreadCount = ref(0);
    const notifications = ref([]);
    const isConnected = ref(false);
    const eventSource = shallowRef(null);
    let reconnectTimer = null;
    const loadNotifications = async () => {
        try {
            notifications.value = await fetchNotifications();
        }
        catch {
            // ignore
        }
    };
    const loadUnreadCount = async () => {
        try {
            unreadCount.value = await fetchUnreadCount();
        }
        catch {
            // ignore
        }
    };
    const connect = () => {
        if (eventSource.value)
            return;
        const es = new EventSource('/api/notifications/stream');
        eventSource.value = es;
        es.addEventListener('notification', (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload.notification) {
                    const n = payload.notification;
                    notifications.value.unshift(n);
                    if (!n.isRead) {
                        unreadCount.value++;
                    }
                }
            }
            catch {
                // ignore
            }
        });
        es.addEventListener('connected', () => {
            isConnected.value = true;
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
        });
        es.addEventListener('ping', () => {
            // keep alive
        });
        es.onerror = () => {
            isConnected.value = false;
            es.close();
            eventSource.value = null;
            reconnectTimer = setTimeout(() => connect(), 5000);
        };
    };
    const disconnect = () => {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        if (eventSource.value) {
            eventSource.value.close();
            eventSource.value = null;
        }
        isConnected.value = false;
    };
    const markAllRead = async () => {
        try {
            await markAllNotificationsRead();
            unreadCount.value = 0;
            for (const n of notifications.value) {
                n.isRead = true;
            }
        }
        catch {
            // ignore
        }
    };
    const markOneRead = async (id) => {
        try {
            await markNotificationRead(id);
            const n = notifications.value.find((x) => x.id === id);
            if (n && !n.isRead) {
                n.isRead = true;
                unreadCount.value = Math.max(0, unreadCount.value - 1);
            }
        }
        catch {
            // ignore
        }
    };
    const deleteOne = async (id) => {
        try {
            await deleteNotification(id);
            const idx = notifications.value.findIndex((x) => x.id === id);
            if (idx !== -1) {
                const wasUnread = !notifications.value[idx].isRead;
                notifications.value.splice(idx, 1);
                if (wasUnread) {
                    unreadCount.value = Math.max(0, unreadCount.value - 1);
                }
            }
        }
        catch {
            // ignore
        }
    };
    return {
        unreadCount,
        notifications,
        isConnected,
        loadNotifications,
        loadUnreadCount,
        connect,
        disconnect,
        markAllRead,
        markOneRead,
        deleteOne,
    };
});
