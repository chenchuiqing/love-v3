/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted, ref } from 'vue';
import { fetchComments, createComment, deleteComment } from '@/api/comments';
import { checkUserSession, getCachedUser } from '@/api/userAuth';
import UserLoginDialog from './UserLoginDialog.vue';
const props = defineProps();
const comments = ref([]);
const loading = ref(false);
const inputText = ref('');
const replyTarget = ref(null);
const submitting = ref(false);
const isLoggedIn = ref(false);
const showLoginDialog = ref(false);
const loadComments = async () => {
    loading.value = true;
    try {
        comments.value = await fetchComments(props.memoryId);
    }
    catch {
        // ignore
    }
    finally {
        loading.value = false;
    }
};
const currentUser = () => getCachedUser();
const canDelete = (comment) => {
    const user = currentUser();
    return user && user.id === comment.userId;
};
const startReply = (comment) => {
    if (!isLoggedIn.value) {
        showLoginDialog.value = true;
        return;
    }
    replyTarget.value = comment;
    inputText.value = '';
};
const cancelReply = () => {
    replyTarget.value = null;
};
const handleSubmit = async () => {
    if (!inputText.value.trim() || submitting.value)
        return;
    if (!isLoggedIn.value) {
        showLoginDialog.value = true;
        return;
    }
    submitting.value = true;
    try {
        await createComment(props.memoryId, {
            content: inputText.value.trim(),
            parentId: replyTarget.value?.id,
        });
        inputText.value = '';
        replyTarget.value = null;
        await loadComments();
    }
    catch {
        // ignore
    }
    finally {
        submitting.value = false;
    }
};
const handleDelete = async (id) => {
    try {
        await deleteComment(id);
        await loadComments();
    }
    catch {
        // ignore
    }
};
const handleLoginSuccess = () => {
    isLoggedIn.value = true;
    showLoginDialog.value = false;
};
const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1)
        return '刚刚';
    if (minutes < 60)
        return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7)
        return `${days} 天前`;
    return date.toLocaleDateString('zh-CN');
};
onMounted(async () => {
    const user = await checkUserSession();
    isLoggedIn.value = !!user;
    await loadComments();
});
const __VLS_exposed = { loadComments };
defineExpose(__VLS_exposed);
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['comment-list']} */ ;
/** @type {__VLS_StyleScopedClasses['author-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['author-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-input']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-input']} */ ;
/** @type {__VLS_StyleScopedClasses['send-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['login-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "comment-section" },
});
/** @type {__VLS_StyleScopedClasses['comment-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-header" },
});
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "section-title" },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "comment-count" },
});
/** @type {__VLS_StyleScopedClasses['comment-count']} */ ;
(__VLS_ctx.comments.length);
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-hint']} */ ;
}
else if (__VLS_ctx.comments.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-hint']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "comment-list" },
    });
    /** @type {__VLS_StyleScopedClasses['comment-list']} */ ;
    for (const [comment] of __VLS_vFor((__VLS_ctx.comments))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (comment.id),
            ...{ class: "comment-item" },
        });
        /** @type {__VLS_StyleScopedClasses['comment-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "comment-head" },
        });
        /** @type {__VLS_StyleScopedClasses['comment-head']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "author-tag" },
            ...{ class: (comment.userId) },
        });
        /** @type {__VLS_StyleScopedClasses['author-tag']} */ ;
        (comment.userName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "comment-time" },
        });
        /** @type {__VLS_StyleScopedClasses['comment-time']} */ ;
        (__VLS_ctx.formatTime(comment.createdAt));
        if (__VLS_ctx.canDelete(comment)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.comments.length === 0))
                            return;
                        if (!(__VLS_ctx.canDelete(comment)))
                            return;
                        __VLS_ctx.handleDelete(comment.id);
                        // @ts-ignore
                        [comments, comments, comments, loading, formatTime, canDelete, handleDelete,];
                    } },
                ...{ class: "delete-btn" },
            });
            /** @type {__VLS_StyleScopedClasses['delete-btn']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "comment-content" },
        });
        /** @type {__VLS_StyleScopedClasses['comment-content']} */ ;
        (comment.content);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.comments.length === 0))
                        return;
                    __VLS_ctx.startReply(comment);
                    // @ts-ignore
                    [startReply,];
                } },
            ...{ class: "reply-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['reply-btn']} */ ;
        if (comment.replies.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "replies" },
            });
            /** @type {__VLS_StyleScopedClasses['replies']} */ ;
            for (const [reply] of __VLS_vFor((comment.replies))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (reply.id),
                    ...{ class: "reply-item" },
                });
                /** @type {__VLS_StyleScopedClasses['reply-item']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "comment-head" },
                });
                /** @type {__VLS_StyleScopedClasses['comment-head']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "author-tag" },
                    ...{ class: (reply.userId) },
                });
                /** @type {__VLS_StyleScopedClasses['author-tag']} */ ;
                (reply.userName);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "comment-time" },
                });
                /** @type {__VLS_StyleScopedClasses['comment-time']} */ ;
                (__VLS_ctx.formatTime(reply.createdAt));
                if (__VLS_ctx.canDelete(reply)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!!(__VLS_ctx.comments.length === 0))
                                    return;
                                if (!(comment.replies.length > 0))
                                    return;
                                if (!(__VLS_ctx.canDelete(reply)))
                                    return;
                                __VLS_ctx.handleDelete(reply.id);
                                // @ts-ignore
                                [formatTime, canDelete, handleDelete,];
                            } },
                        ...{ class: "delete-btn" },
                    });
                    /** @type {__VLS_StyleScopedClasses['delete-btn']} */ ;
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "comment-content" },
                });
                /** @type {__VLS_StyleScopedClasses['comment-content']} */ ;
                (reply.content);
                // @ts-ignore
                [];
            }
        }
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.replyTarget) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "reply-indicator" },
    });
    /** @type {__VLS_StyleScopedClasses['reply-indicator']} */ ;
    (__VLS_ctx.replyTarget.userName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "reply-preview" },
    });
    /** @type {__VLS_StyleScopedClasses['reply-preview']} */ ;
    (__VLS_ctx.replyTarget.content.slice(0, 30));
    (__VLS_ctx.replyTarget.content.length > 30 ? '...' : '');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.cancelReply) },
        ...{ class: "cancel-reply" },
    });
    /** @type {__VLS_StyleScopedClasses['cancel-reply']} */ ;
}
if (__VLS_ctx.isLoggedIn) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "input-area" },
    });
    /** @type {__VLS_StyleScopedClasses['input-area']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        ...{ onKeydown: (__VLS_ctx.handleSubmit) },
        value: (__VLS_ctx.inputText),
        ...{ class: "comment-input" },
        placeholder: (__VLS_ctx.replyTarget ? '写下回复...' : '写下你的回忆对话...'),
        rows: "2",
    });
    /** @type {__VLS_StyleScopedClasses['comment-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleSubmit) },
        ...{ class: "send-btn" },
        disabled: (!__VLS_ctx.inputText.trim() || __VLS_ctx.submitting),
    });
    /** @type {__VLS_StyleScopedClasses['send-btn']} */ ;
    (__VLS_ctx.submitting ? '发送中...' : '发送');
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "login-prompt" },
    });
    /** @type {__VLS_StyleScopedClasses['login-prompt']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.isLoggedIn))
                    return;
                __VLS_ctx.showLoginDialog = true;
                // @ts-ignore
                [replyTarget, replyTarget, replyTarget, replyTarget, replyTarget, cancelReply, isLoggedIn, handleSubmit, handleSubmit, inputText, inputText, submitting, submitting, showLoginDialog,];
            } },
        ...{ class: "login-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['login-btn']} */ ;
}
if (__VLS_ctx.showLoginDialog) {
    const __VLS_0 = UserLoginDialog;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onClose': {} },
        ...{ 'onLoginSuccess': {} },
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onClose': {} },
        ...{ 'onLoginSuccess': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = {
        ...{ close: {} },
        onClose: (...[$event]) => {
            if (!(__VLS_ctx.showLoginDialog))
                return;
            __VLS_ctx.showLoginDialog = false;
            // @ts-ignore
            [showLoginDialog, showLoginDialog,];
        },
        ...{ loginSuccess: {} },
        onLoginSuccess: (__VLS_ctx.handleLoginSuccess),
    };
    var __VLS_3;
    var __VLS_4;
}
// @ts-ignore
[handleLoginSuccess,];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => __VLS_exposed,
    __typeProps: {},
});
export default {};
