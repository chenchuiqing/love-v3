/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted, ref } from 'vue';
import { ApiError } from '@/api/client';
import { getUserOptions, userLogin } from '@/api/userAuth';
const emit = defineEmits();
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
        emit('login-success');
        emit('close');
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
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['user-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['user-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['password-label']} */ ;
/** @type {__VLS_StyleScopedClasses['password-label']} */ ;
/** @type {__VLS_StyleScopedClasses['submit-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('close');
            // @ts-ignore
            [emit,];
        } },
    ...{ class: "dialog-overlay" },
});
/** @type {__VLS_StyleScopedClasses['dialog-overlay']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dialog-card" },
});
/** @type {__VLS_StyleScopedClasses['dialog-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "dialog-title" },
});
/** @type {__VLS_StyleScopedClasses['dialog-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "user-options" },
});
/** @type {__VLS_StyleScopedClasses['user-options']} */ ;
for (const [opt] of __VLS_vFor((__VLS_ctx.options))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectedUser = opt;
                // @ts-ignore
                [options, selectedUser,];
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "password-label" },
    });
    /** @type {__VLS_StyleScopedClasses['password-label']} */ ;
    (__VLS_ctx.selectedUser.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onKeyup: (__VLS_ctx.handleSubmit) },
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dialog-actions" },
});
/** @type {__VLS_StyleScopedClasses['dialog-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('close');
            // @ts-ignore
            [emit, selectedUser, selectedUser, handleSubmit, password, errorMessage, errorMessage,];
        } },
    type: "button",
    ...{ class: "cancel-btn" },
});
/** @type {__VLS_StyleScopedClasses['cancel-btn']} */ ;
if (__VLS_ctx.selectedUser) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleSubmit) },
        type: "button",
        ...{ class: "submit-btn" },
        disabled: (__VLS_ctx.loading),
    });
    /** @type {__VLS_StyleScopedClasses['submit-btn']} */ ;
    (__VLS_ctx.loading ? '登录中...' : '登录');
}
// @ts-ignore
[selectedUser, handleSubmit, loading, loading,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
});
export default {};
