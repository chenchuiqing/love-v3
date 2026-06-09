/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { fetchMemories } from '@/api/memories';
import MemoryPlanet from './MemoryPlanet.vue';
import MemoryDetail from './MemoryDetail.vue';
const props = defineProps();
const phase = ref(props.resumeExploring ? 'exploring' : 'forming');
const activeMemory = ref(null);
const visitedIds = ref(new Set(props.initialVisitedIds ?? []));
const memories = ref([]);
const isLoading = ref(true);
const loadError = ref('');
const emit = defineEmits();
const syncVisitedToParent = () => {
    emit('visitedUpdate', Array.from(visitedIds.value));
};
const CORE_ACTIVATE_THRESHOLD = 3;
const CORE_HINT_DURATION_MS = 4500;
const showDetail = computed(() => phase.value === 'viewing' && activeMemory.value !== null);
const coreHintVisible = ref(false);
const coreHintShownForSession = ref((props.initialVisitedIds?.length ?? 0) >= CORE_ACTIVATE_THRESHOLD);
let coreHintTimer = null;
const clearCoreHintTimer = () => {
    if (coreHintTimer !== null) {
        clearTimeout(coreHintTimer);
        coreHintTimer = null;
    }
};
const showCoreHintBriefly = () => {
    clearCoreHintTimer();
    coreHintVisible.value = true;
    coreHintTimer = setTimeout(() => {
        coreHintVisible.value = false;
        coreHintTimer = null;
    }, CORE_HINT_DURATION_MS);
};
const handleFormingComplete = () => {
    phase.value = 'exploring';
};
const handleNodeClick = (memory) => {
    visitedIds.value.add(memory.id);
    syncVisitedToParent();
    activeMemory.value = memory;
    phase.value = 'zooming';
};
const handleZoomComplete = () => {
    phase.value = 'viewing';
};
const handleDetailClose = () => {
    phase.value = 'returning';
};
const handleReturnComplete = () => {
    activeMemory.value = null;
    phase.value = 'exploring';
    if (visitedIds.value.size >= CORE_ACTIVATE_THRESHOLD &&
        !coreHintShownForSession.value) {
        coreHintShownForSession.value = true;
        showCoreHintBriefly();
    }
};
const handleCoreActivate = () => {
    if (phase.value !== 'exploring')
        return;
    phase.value = 'awakening';
};
const handleAwakeningComplete = () => {
    syncVisitedToParent();
    emit('complete');
};
onMounted(() => {
    fetchMemories()
        .then((list) => {
        memories.value = list;
    })
        .catch((error) => {
        loadError.value = error instanceof Error ? error.message : '加载记忆失败';
        memories.value = [];
    })
        .finally(() => {
        isLoading.value = false;
    });
    if (props.resumeExploring && visitedIds.value.size > 0) {
        syncVisitedToParent();
    }
});
onUnmounted(() => {
    clearCoreHintTimer();
});
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "phase-two" },
});
/** @type {__VLS_StyleScopedClasses['phase-two']} */ ;
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "load-status" },
    });
    /** @type {__VLS_StyleScopedClasses['load-status']} */ ;
}
else if (__VLS_ctx.loadError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "load-status load-status--error" },
    });
    /** @type {__VLS_StyleScopedClasses['load-status']} */ ;
    /** @type {__VLS_StyleScopedClasses['load-status--error']} */ ;
    (__VLS_ctx.loadError);
}
if (!__VLS_ctx.isLoading) {
    const __VLS_0 = MemoryPlanet;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onFormingComplete': {} },
        ...{ 'onNodeClick': {} },
        ...{ 'onCoreActivate': {} },
        ...{ 'onZoomComplete': {} },
        ...{ 'onReturnComplete': {} },
        ...{ 'onAwakeningComplete': {} },
        phase: (__VLS_ctx.phase),
        memories: (__VLS_ctx.memories),
        activeMemory: (__VLS_ctx.activeMemory),
        skipForming: (__VLS_ctx.resumeExploring),
        initialVisitedIds: (__VLS_ctx.resumeExploring ? Array.from(__VLS_ctx.visitedIds) : undefined),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onFormingComplete': {} },
        ...{ 'onNodeClick': {} },
        ...{ 'onCoreActivate': {} },
        ...{ 'onZoomComplete': {} },
        ...{ 'onReturnComplete': {} },
        ...{ 'onAwakeningComplete': {} },
        phase: (__VLS_ctx.phase),
        memories: (__VLS_ctx.memories),
        activeMemory: (__VLS_ctx.activeMemory),
        skipForming: (__VLS_ctx.resumeExploring),
        initialVisitedIds: (__VLS_ctx.resumeExploring ? Array.from(__VLS_ctx.visitedIds) : undefined),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = {
        ...{ formingComplete: {} },
        onFormingComplete: (__VLS_ctx.handleFormingComplete),
        ...{ nodeClick: {} },
        onNodeClick: (__VLS_ctx.handleNodeClick),
        ...{ coreActivate: {} },
        onCoreActivate: (__VLS_ctx.handleCoreActivate),
        ...{ zoomComplete: {} },
        onZoomComplete: (__VLS_ctx.handleZoomComplete),
        ...{ returnComplete: {} },
        onReturnComplete: (__VLS_ctx.handleReturnComplete),
        ...{ awakeningComplete: {} },
        onAwakeningComplete: (__VLS_ctx.handleAwakeningComplete),
    };
    var __VLS_3;
    var __VLS_4;
}
if (!__VLS_ctx.isLoading && !__VLS_ctx.loadError && __VLS_ctx.memories.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "load-status" },
    });
    /** @type {__VLS_StyleScopedClasses['load-status']} */ ;
}
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    enterActiveClass: "transition-opacity duration-500",
    leaveActiveClass: "transition-opacity duration-500",
    enterFromClass: "opacity-0",
    leaveToClass: "opacity-0",
}));
const __VLS_9 = __VLS_8({
    enterActiveClass: "transition-opacity duration-500",
    leaveActiveClass: "transition-opacity duration-500",
    enterFromClass: "opacity-0",
    leaveToClass: "opacity-0",
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const { default: __VLS_12 } = __VLS_10.slots;
if (__VLS_ctx.coreHintVisible) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "core-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['core-hint']} */ ;
}
// @ts-ignore
[isLoading, isLoading, isLoading, loadError, loadError, loadError, phase, memories, memories, activeMemory, resumeExploring, resumeExploring, visitedIds, handleFormingComplete, handleNodeClick, handleCoreActivate, handleZoomComplete, handleReturnComplete, handleAwakeningComplete, coreHintVisible,];
var __VLS_10;
let __VLS_13;
/** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    enterActiveClass: "transition-opacity duration-500",
    leaveActiveClass: "transition-opacity duration-500",
    enterFromClass: "opacity-0",
    leaveToClass: "opacity-0",
}));
const __VLS_15 = __VLS_14({
    enterActiveClass: "transition-opacity duration-500",
    leaveActiveClass: "transition-opacity duration-500",
    enterFromClass: "opacity-0",
    leaveToClass: "opacity-0",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
const { default: __VLS_18 } = __VLS_16.slots;
if (__VLS_ctx.showDetail && __VLS_ctx.activeMemory) {
    const __VLS_19 = MemoryDetail;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
        ...{ 'onClose': {} },
        memory: (__VLS_ctx.activeMemory),
    }));
    const __VLS_21 = __VLS_20({
        ...{ 'onClose': {} },
        memory: (__VLS_ctx.activeMemory),
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
    let __VLS_24;
    const __VLS_25 = {
        ...{ close: {} },
        onClose: (__VLS_ctx.handleDetailClose),
    };
    var __VLS_22;
    var __VLS_23;
}
// @ts-ignore
[activeMemory, activeMemory, showDetail, handleDetailClose,];
var __VLS_16;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
