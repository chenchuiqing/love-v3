/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import { getUserOptions, userLogin } from '@/api/userAuth';
const route = useRoute();
const router = useRouter();
const options = ref([]);
const selectedUser = ref(null);
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
onMounted(async () => {
    try {
        options.value = await getUserOptions();
    }
    catch {
        errorMessage.value = '获取用户列表失败';
    }
});
const handleSubmit = async () => {
    if (!selectedUser.value) {
        errorMessage.value = '请选择身份';
        return;
    }
    if (!password.value) {
        errorMessage.value = '请输入密码';
        return;
    }
    loading.value = true;
    errorMessage.value = '';
    try {
        await userLogin(selectedUser.value.name, password.value);
        const redirect = route.query.redirect;
        const target = typeof redirect === 'string' && redirect.startsWith('/publish') ? redirect : '/publish/memories';
        await router.replace(target);
    }
    catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            errorMessage.value = '密码错误';
        }
        else if (error instanceof Error) {
            errorMessage.value = error.message;
        }
        else {
            errorMessage.value = '登录失败';
        }
    }
    finally {
        loading.value = false;
    }
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['login-card']} */ ;
/** @type {__VLS_StyleScopedClasses['user-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['user-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "login-page" },
});
/** @type {__VLS_StyleScopedClasses['login-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.handleSubmit) },
    ...{ class: "login-card" },
});
/** @type {__VLS_StyleScopedClasses['login-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "hint" },
});
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "user-options" },
});
/** @type {__VLS_StyleScopedClasses['user-options']} */ ;
for (const [opt] of __VLS_vFor((__VLS_ctx.options))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectedUser = opt;
                // @ts-ignore
                [handleSubmit, options, selectedUser,];
            } },
        key: (opt.id),
        type: "button",
        ...{ class: "user-btn" },
        ...{ class: ({ active: __VLS_ctx.selectedUser?.id === opt.id }) },
    });
    /** @type {__VLS_StyleScopedClasses['user-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    (opt.name);
    // @ts-ignore
    [selectedUser,];
}
if (__VLS_ctx.selectedUser) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.selectedUser.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "password",
        autocomplete: "current-password",
    });
    (__VLS_ctx.password);
}
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.errorMessage);
}
if (__VLS_ctx.selectedUser) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        disabled: (__VLS_ctx.loading),
    });
    (__VLS_ctx.loading ? '登录中...' : '登录');
}
// @ts-ignore
[selectedUser, selectedUser, selectedUser, password, errorMessage, errorMessage, loading, loading,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
