/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import PhaseOne from './components/PhaseOne.vue';
import PhaseTwo from './components/PhaseTwo.vue';
import PhaseThree from './components/PhaseThree.vue';
import FloatingMusicPlayer from './components/FloatingMusicPlayer.vue';
import NotificationBell from './components/NotificationBell.vue';
const route = useRoute();
const isPublishRoute = computed(() => route.path.startsWith('/publish'));
const currentPhase = ref(1);
const phaseTwoResume = ref(false);
const visitedMemoryIds = ref(new Set());
const isTransitioning = ref(false);
const isFullscreen = ref(false);
const isFullscreenSupported = ref(false);
const appRef = ref(null);
const handlePhaseOneComplete = () => {
    isTransitioning.value = true;
    setTimeout(() => {
        currentPhase.value = 2;
        setTimeout(() => {
            isTransitioning.value = false;
        }, 1200);
    }, 800);
};
const handlePhaseTwoComplete = () => {
    phaseTwoResume.value = false;
    isTransitioning.value = true;
    setTimeout(() => {
        currentPhase.value = 3;
        setTimeout(() => {
            isTransitioning.value = false;
        }, 1200);
    }, 800);
};
const handleBackToPlanet = () => {
    isTransitioning.value = true;
    setTimeout(() => {
        phaseTwoResume.value = true;
        currentPhase.value = 2;
        setTimeout(() => {
            isTransitioning.value = false;
        }, 1200);
    }, 800);
};
const handleVisitedUpdate = (ids) => {
    visitedMemoryIds.value = new Set(ids);
};
const handleAct1Complete = () => {
    console.info('阶段三第一幕已完成，待接入第二幕');
};
const toggleFullscreen = async () => {
    if (!appRef.value)
        return;
    try {
        const el = appRef.value;
        const doc = document;
        const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.webkitIsFullScreen);
        if (isFull) {
            if (doc.exitFullscreen)
                await doc.exitFullscreen();
            else if (doc.webkitExitFullscreen)
                await doc.webkitExitFullscreen();
        }
        else {
            if (el.requestFullscreen)
                await el.requestFullscreen();
            else if (el.webkitRequestFullscreen)
                await el.webkitRequestFullscreen();
        }
    }
    catch (error) {
        console.warn('全屏切换失败', error);
    }
};
const syncFullscreenState = () => {
    const doc = document;
    isFullscreen.value = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.webkitIsFullScreen);
};
const applyScrollModeByRoute = (publishMode) => {
    const appRoot = document.getElementById('app');
    if (!appRoot)
        return;
    if (publishMode) {
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';
        appRoot.style.height = 'auto';
        appRoot.style.minHeight = '100%';
        return;
    }
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    appRoot.style.height = '100%';
    appRoot.style.minHeight = '';
};
onMounted(() => {
    const el = document.documentElement;
    isFullscreenSupported.value = !!(el.requestFullscreen || el.webkitRequestFullscreen);
    document.addEventListener('fullscreenchange', syncFullscreenState);
    document.addEventListener('webkitfullscreenchange', syncFullscreenState);
    syncFullscreenState();
    applyScrollModeByRoute(isPublishRoute.value);
});
watch(isPublishRoute, (nextValue) => {
    applyScrollModeByRoute(nextValue);
});
onUnmounted(() => {
    document.removeEventListener('fullscreenchange', syncFullscreenState);
    document.removeEventListener('webkitfullscreenchange', syncFullscreenState);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    const appRoot = document.getElementById('app');
    if (appRoot) {
        appRoot.style.height = '';
        appRoot.style.minHeight = '';
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
if (__VLS_ctx.isPublishRoute) {
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.RouterView} */
    RouterView;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
    const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_5;
    var __VLS_3;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ref: "appRef",
        ...{ class: "app-root" },
    });
    /** @type {__VLS_StyleScopedClasses['app-root']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "top-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['top-bar']} */ ;
    const __VLS_6 = NotificationBell;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({}));
    const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
    if (__VLS_ctx.isFullscreenSupported) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.toggleFullscreen) },
            ...{ class: "fullscreen-button" },
        });
        /** @type {__VLS_StyleScopedClasses['fullscreen-button']} */ ;
        (__VLS_ctx.isFullscreen ? '退出全屏' : '进入全屏');
    }
    let __VLS_11;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
        name: "flash",
    }));
    const __VLS_13 = __VLS_12({
        name: "flash",
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    const { default: __VLS_16 } = __VLS_14.slots;
    if (__VLS_ctx.isTransitioning) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "transition-flash" },
        });
        /** @type {__VLS_StyleScopedClasses['transition-flash']} */ ;
    }
    // @ts-ignore
    [isPublishRoute, isFullscreenSupported, toggleFullscreen, isFullscreen, isTransitioning,];
    var __VLS_14;
    let __VLS_17;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        name: "phase-fade",
    }));
    const __VLS_19 = __VLS_18({
        name: "phase-fade",
    }, ...__VLS_functionalComponentArgsRest(__VLS_18));
    const { default: __VLS_22 } = __VLS_20.slots;
    if (__VLS_ctx.currentPhase === 1) {
        const __VLS_23 = PhaseOne;
        // @ts-ignore
        const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
            ...{ 'onComplete': {} },
        }));
        const __VLS_25 = __VLS_24({
            ...{ 'onComplete': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_24));
        let __VLS_28;
        const __VLS_29 = {
            ...{ complete: {} },
            onComplete: (__VLS_ctx.handlePhaseOneComplete),
        };
        var __VLS_26;
        var __VLS_27;
    }
    // @ts-ignore
    [currentPhase, handlePhaseOneComplete,];
    var __VLS_20;
    let __VLS_30;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
        name: "phase-fade",
    }));
    const __VLS_32 = __VLS_31({
        name: "phase-fade",
    }, ...__VLS_functionalComponentArgsRest(__VLS_31));
    const { default: __VLS_35 } = __VLS_33.slots;
    if (__VLS_ctx.currentPhase === 2) {
        const __VLS_36 = PhaseTwo;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
            ...{ 'onVisitedUpdate': {} },
            ...{ 'onComplete': {} },
            resumeExploring: (__VLS_ctx.phaseTwoResume),
            initialVisitedIds: (__VLS_ctx.phaseTwoResume ? Array.from(__VLS_ctx.visitedMemoryIds) : undefined),
        }));
        const __VLS_38 = __VLS_37({
            ...{ 'onVisitedUpdate': {} },
            ...{ 'onComplete': {} },
            resumeExploring: (__VLS_ctx.phaseTwoResume),
            initialVisitedIds: (__VLS_ctx.phaseTwoResume ? Array.from(__VLS_ctx.visitedMemoryIds) : undefined),
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        let __VLS_41;
        const __VLS_42 = {
            ...{ visitedUpdate: {} },
            onVisitedUpdate: (__VLS_ctx.handleVisitedUpdate),
            ...{ complete: {} },
            onComplete: (__VLS_ctx.handlePhaseTwoComplete),
        };
        var __VLS_39;
        var __VLS_40;
    }
    // @ts-ignore
    [currentPhase, phaseTwoResume, phaseTwoResume, visitedMemoryIds, handleVisitedUpdate, handlePhaseTwoComplete,];
    var __VLS_33;
    let __VLS_43;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
        name: "phase-fade",
    }));
    const __VLS_45 = __VLS_44({
        name: "phase-fade",
    }, ...__VLS_functionalComponentArgsRest(__VLS_44));
    const { default: __VLS_48 } = __VLS_46.slots;
    if (__VLS_ctx.currentPhase === 3) {
        const __VLS_49 = PhaseThree;
        // @ts-ignore
        const __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
            ...{ 'onAct1Complete': {} },
            ...{ 'onBackToPlanet': {} },
        }));
        const __VLS_51 = __VLS_50({
            ...{ 'onAct1Complete': {} },
            ...{ 'onBackToPlanet': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_50));
        let __VLS_54;
        const __VLS_55 = {
            ...{ act1Complete: {} },
            onAct1Complete: (__VLS_ctx.handleAct1Complete),
            ...{ backToPlanet: {} },
            onBackToPlanet: (__VLS_ctx.handleBackToPlanet),
        };
        var __VLS_52;
        var __VLS_53;
    }
    // @ts-ignore
    [currentPhase, handleAct1Complete, handleBackToPlanet,];
    var __VLS_46;
    const __VLS_56 = FloatingMusicPlayer;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({}));
    const __VLS_58 = __VLS_57({}, ...__VLS_functionalComponentArgsRest(__VLS_57));
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
