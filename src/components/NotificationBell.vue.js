/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted, onUnmounted, ref } from 'vue';
import { useNotificationStore } from '@/stores/notifications';
import { checkUserSession } from '@/api/userAuth';
const notifStore = useNotificationStore();
const isOpen = ref(false);
const isLoggedIn = ref(false);
const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
    if (isOpen.value && notifStore.unreadCount > 0) {
        notifStore.markAllRead();
    }
};
const closeDropdown = (e) => {
    const target = e.target;
    if (!target.closest('.notif-container')) {
        isOpen.value = false;
    }
};
const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1)
        return '刚刚';
    if (minutes < 60)
        return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
};
onMounted(async () => {
    const user = await checkUserSession();
    isLoggedIn.value = !!user;
    if (user) {
        notifStore.connect();
        notifStore.loadUnreadCount();
        notifStore.loadNotifications();
        document.addEventListener('click', closeDropdown);
    }
});
onUnmounted(() => {
    document.removeEventListener('click', closeDropdown);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['notif-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-list']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-item']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-item']} */ ;
if (__VLS_ctx.isLoggedIn) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "notif-container" },
    });
    /** @type {__VLS_StyleScopedClasses['notif-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleDropdown) },
        ...{ class: "notif-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['notif-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "bell-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['bell-icon']} */ ;
    if (__VLS_ctx.notifStore.unreadCount > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "badge" },
        });
        /** @type {__VLS_StyleScopedClasses['badge']} */ ;
        (__VLS_ctx.notifStore.unreadCount > 99 ? '99+' : __VLS_ctx.notifStore.unreadCount);
    }
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        name: "dropdown",
    }));
    const __VLS_2 = __VLS_1({
        name: "dropdown",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_5 } = __VLS_3.slots;
    if (__VLS_ctx.isOpen) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dropdown" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dropdown-header" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        if (__VLS_ctx.notifStore.isConnected) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "connected-dot" },
                title: "实时连接中",
            });
            /** @type {__VLS_StyleScopedClasses['connected-dot']} */ ;
        }
        if (__VLS_ctx.notifStore.notifications.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "dropdown-empty" },
            });
            /** @type {__VLS_StyleScopedClasses['dropdown-empty']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "dropdown-list" },
            });
            /** @type {__VLS_StyleScopedClasses['dropdown-list']} */ ;
            for (const [n] of __VLS_vFor((__VLS_ctx.notifStore.notifications.slice(0, 20)))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (n.id),
                    ...{ class: "notif-item" },
                    ...{ class: ({ unread: !n.isRead }) },
                });
                /** @type {__VLS_StyleScopedClasses['notif-item']} */ ;
                /** @type {__VLS_StyleScopedClasses['unread']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "notif-title" },
                });
                /** @type {__VLS_StyleScopedClasses['notif-title']} */ ;
                (n.title);
                if (n.content) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "notif-content" },
                    });
                    /** @type {__VLS_StyleScopedClasses['notif-content']} */ ;
                    (n.content);
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "notif-time" },
                });
                /** @type {__VLS_StyleScopedClasses['notif-time']} */ ;
                (__VLS_ctx.formatTime(n.createdAt));
                // @ts-ignore
                [isLoggedIn, toggleDropdown, notifStore, notifStore, notifStore, notifStore, notifStore, notifStore, isOpen, formatTime,];
            }
        }
    }
    // @ts-ignore
    [];
    var __VLS_3;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
