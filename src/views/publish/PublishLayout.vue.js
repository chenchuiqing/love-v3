/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { userLogout, getCachedUser } from '@/api/userAuth';
import { useNotificationStore } from '@/stores/notifications';
const route = useRoute();
const router = useRouter();
const notifStore = useNotificationStore();
const pageTitle = computed(() => {
    if (route.name === 'PublishMemoryCreate')
        return '新建记忆点';
    if (route.name === 'PublishMemoryEdit')
        return '编辑记忆点';
    return '记忆点列表';
});
const currentUser = computed(() => getCachedUser());
const handleLogout = async () => {
    notifStore.disconnect();
    await userLogout();
    await router.push({ name: 'PublishLogin' });
};
onMounted(() => {
    notifStore.connect();
    notifStore.loadUnreadCount();
});
onUnmounted(() => {
    notifStore.disconnect();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['publish-header']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['link']} */ ;
/** @type {__VLS_StyleScopedClasses['logout']} */ ;
/** @type {__VLS_StyleScopedClasses['publish-main']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "publish-layout" },
});
/** @type {__VLS_StyleScopedClasses['publish-layout']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "publish-header" },
});
/** @type {__VLS_StyleScopedClasses['publish-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "brand" },
});
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
(__VLS_ctx.currentUser?.name ?? '');
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "title" },
});
/** @type {__VLS_StyleScopedClasses['title']} */ ;
(__VLS_ctx.pageTitle);
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "actions" },
});
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
RouterLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ class: "link" },
    to: ({ name: 'PublishMemoryList' }),
}));
const __VLS_2 = __VLS_1({
    ...{ class: "link" },
    to: ({ name: 'PublishMemoryList' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['link']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
// @ts-ignore
[currentUser, pageTitle,];
var __VLS_3;
let __VLS_6;
/** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
RouterLink;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    ...{ class: "link" },
    to: ({ name: 'PublishMemoryCreate' }),
}));
const __VLS_8 = __VLS_7({
    ...{ class: "link" },
    to: ({ name: 'PublishMemoryCreate' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
/** @type {__VLS_StyleScopedClasses['link']} */ ;
const { default: __VLS_11 } = __VLS_9.slots;
// @ts-ignore
[];
var __VLS_9;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "notif-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['notif-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.notifStore.markAllRead) },
    ...{ class: "notif-btn" },
});
/** @type {__VLS_StyleScopedClasses['notif-btn']} */ ;
(__VLS_ctx.notifStore.unreadCount > 0 ? `🔔 ${__VLS_ctx.notifStore.unreadCount}` : '🔕');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.handleLogout) },
    ...{ class: "logout" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['logout']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "publish-main" },
});
/** @type {__VLS_StyleScopedClasses['publish-main']} */ ;
let __VLS_12;
/** @ts-ignore @type { | typeof __VLS_components.RouterView} */
RouterView;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({}));
const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
// @ts-ignore
[notifStore, notifStore, notifStore, handleLogout,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
