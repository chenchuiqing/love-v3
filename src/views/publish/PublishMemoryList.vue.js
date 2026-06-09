/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted, ref } from 'vue';
import { ApiError } from '@/api/client';
import { deletePublishMemory, fetchPublishMemories } from '@/api/memories';
const memories = ref([]);
const loading = ref(false);
const errorMessage = ref('');
const deletingId = ref('');
const sortOrder = ref('asc');
const confirmVisible = ref(false);
const confirmTarget = ref(null);
const openConfirm = (id, title) => {
    confirmTarget.value = { id, title };
    confirmVisible.value = true;
};
const cancelDelete = () => {
    confirmVisible.value = false;
    confirmTarget.value = null;
};
const toDateNum = (s) => {
    const cn = s.match(/^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
    if (cn)
        return `${cn[1]}${cn[2].padStart(2, '0')}${cn[3].padStart(2, '0')}`;
    const dot = s.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})/);
    if (dot)
        return `${dot[1]}${dot[2].padStart(2, '0')}${dot[3].padStart(2, '0')}`;
    return s;
};
const sortMemories = (data) => {
    const sorted = data.sort((a, b) => {
        const da = toDateNum(a.date);
        const db = toDateNum(b.date);
        return da.localeCompare(db);
    });
    if (sortOrder.value === 'desc')
        sorted.reverse();
    return sorted;
};
const toggleSort = () => {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    memories.value = sortMemories(memories.value);
};
const loadMemories = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
        const data = await fetchPublishMemories();
        memories.value = sortMemories(data);
    }
    catch (error) {
        if (error instanceof Error) {
            errorMessage.value = error.message;
        }
        else {
            errorMessage.value = '加载失败';
        }
    }
    finally {
        loading.value = false;
    }
};
const handleDelete = async () => {
    if (!confirmTarget.value)
        return;
    const { id } = confirmTarget.value;
    deletingId.value = id;
    errorMessage.value = '';
    confirmVisible.value = false;
    try {
        await deletePublishMemory(id);
        memories.value = memories.value.filter((item) => item.id !== id);
    }
    catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            errorMessage.value = '登录已失效，请重新登录';
            return;
        }
        if (error instanceof Error) {
            errorMessage.value = error.message;
            return;
        }
        errorMessage.value = '删除失败';
    }
    finally {
        deletingId.value = '';
        confirmTarget.value = null;
    }
};
onMounted(() => {
    void loadMemories();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['th-date']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['sort-mobile']} */ ;
/** @type {__VLS_StyleScopedClasses['th-date']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-cell']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "panel" },
});
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "toolbar" },
});
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
RouterLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ class: "primary" },
    to: ({ name: 'PublishMemoryCreate' }),
}));
const __VLS_2 = __VLS_1({
    ...{ class: "primary" },
    to: ({ name: 'PublishMemoryCreate' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
var __VLS_3;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.loadMemories) },
    type: "button",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.toggleSort) },
    type: "button",
    ...{ class: "sort-mobile" },
});
/** @type {__VLS_StyleScopedClasses['sort-mobile']} */ ;
(__VLS_ctx.sortOrder === 'asc' ? '↑ 升序' : '↓ 降序');
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.errorMessage);
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "hint" },
    });
    /** @type {__VLS_StyleScopedClasses['hint']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "table" },
    });
    /** @type {__VLS_StyleScopedClasses['table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ onClick: (__VLS_ctx.toggleSort) },
        ...{ class: "th-date" },
    });
    /** @type {__VLS_StyleScopedClasses['th-date']} */ ;
    (__VLS_ctx.sortOrder === 'asc' ? '↑' : '↓');
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [item] of __VLS_vFor((__VLS_ctx.memories))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (item.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            'data-label': "标题",
        });
        (item.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            'data-label': "日期",
        });
        (item.date);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            'data-label': "类型",
        });
        (item.type);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            'data-label': "颜色",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "color-dot" },
            ...{ style: ({ backgroundColor: item.color }) },
        });
        /** @type {__VLS_StyleScopedClasses['color-dot']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "color-value" },
        });
        /** @type {__VLS_StyleScopedClasses['color-value']} */ ;
        (item.color);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            'data-label': "坐标",
            ...{ class: "coord-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['coord-cell']} */ ;
        (item.position.theta.toFixed(2));
        (item.position.phi.toFixed(2));
        (item.orbitRadius.toFixed(2));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            'data-label': "操作",
            ...{ class: "actions-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['actions-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            href: (`/?memory=${item.id}`),
            target: "_blank",
            rel: "noreferrer",
        });
        let __VLS_6;
        /** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            to: ({ name: 'PublishMemoryEdit', params: { id: item.id } }),
        }));
        const __VLS_8 = __VLS_7({
            to: ({ name: 'PublishMemoryEdit', params: { id: item.id } }),
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        const { default: __VLS_11 } = __VLS_9.slots;
        // @ts-ignore
        [loadMemories, toggleSort, toggleSort, sortOrder, sortOrder, errorMessage, errorMessage, loading, memories,];
        var __VLS_9;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.openConfirm(item.id, item.title);
                    // @ts-ignore
                    [openConfirm,];
                } },
            type: "button",
            ...{ class: "danger" },
            disabled: (__VLS_ctx.deletingId === item.id),
        });
        /** @type {__VLS_StyleScopedClasses['danger']} */ ;
        (__VLS_ctx.deletingId === item.id ? '删除中...' : '删除');
        // @ts-ignore
        [deletingId, deletingId,];
    }
}
let __VLS_12;
/** @ts-ignore @type { | typeof __VLS_components.Teleport | typeof __VLS_components.Teleport} */
Teleport;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    to: "body",
}));
const __VLS_14 = __VLS_13({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const { default: __VLS_17 } = __VLS_15.slots;
if (__VLS_ctx.confirmVisible) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.cancelDelete) },
        ...{ class: "overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dialog" },
    });
    /** @type {__VLS_StyleScopedClasses['dialog']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "dialog-msg" },
    });
    /** @type {__VLS_StyleScopedClasses['dialog-msg']} */ ;
    (__VLS_ctx.confirmTarget?.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dialog-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['dialog-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.cancelDelete) },
        type: "button",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleDelete) },
        type: "button",
        ...{ class: "danger" },
    });
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
}
// @ts-ignore
[confirmVisible, cancelDelete, cancelDelete, confirmTarget, handleDelete,];
var __VLS_15;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
