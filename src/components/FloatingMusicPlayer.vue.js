/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, ref, watch } from 'vue';
import { useMusicPlayerStore } from '@/stores/musicPlayer';
const musicPlayer = useMusicPlayerStore();
const isCollapsed = ref(false);
watch(() => musicPlayer.isVisible, (visible) => {
    if (!visible)
        isCollapsed.value = false;
});
const formatTime = (sec) => {
    if (!Number.isFinite(sec) || sec < 0)
        return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};
const currentTimeText = computed(() => formatTime(musicPlayer.currentTime));
const durationText = computed(() => formatTime(musicPlayer.duration));
const handleSeek = (event) => {
    const target = event.target;
    const ratio = Number(target.value) / 100;
    musicPlayer.seek(ratio * (musicPlayer.duration || 0));
};
const handleToggle = () => {
    musicPlayer.toggle();
};
const handleVinylClick = () => {
    if (isCollapsed.value) {
        isCollapsed.value = false;
        return;
    }
    handleToggle();
};
const handleCollapse = () => {
    isCollapsed.value = true;
};
const handleClose = () => {
    musicPlayer.close();
};
const waveBars = [0, 1, 2, 3, 4];
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['floating-player']} */ ;
/** @type {__VLS_StyleScopedClasses['player-card']} */ ;
/** @type {__VLS_StyleScopedClasses['player-card']} */ ;
/** @type {__VLS_StyleScopedClasses['is-collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['floating-player']} */ ;
/** @type {__VLS_StyleScopedClasses['is-collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['aura']} */ ;
/** @type {__VLS_StyleScopedClasses['aura']} */ ;
/** @type {__VLS_StyleScopedClasses['aura-ring']} */ ;
/** @type {__VLS_StyleScopedClasses['aura']} */ ;
/** @type {__VLS_StyleScopedClasses['is-playing']} */ ;
/** @type {__VLS_StyleScopedClasses['aura']} */ ;
/** @type {__VLS_StyleScopedClasses['is-playing']} */ ;
/** @type {__VLS_StyleScopedClasses['vinyl']} */ ;
/** @type {__VLS_StyleScopedClasses['is-playing']} */ ;
/** @type {__VLS_StyleScopedClasses['vinyl-arm']} */ ;
/** @type {__VLS_StyleScopedClasses['is-playing']} */ ;
/** @type {__VLS_StyleScopedClasses['vinyl-arm']} */ ;
/** @type {__VLS_StyleScopedClasses['vinyl-arm']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-track-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['wave']} */ ;
/** @type {__VLS_StyleScopedClasses['is-playing']} */ ;
/** @type {__VLS_StyleScopedClasses['wave-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['ctrl-button']} */ ;
/** @type {__VLS_StyleScopedClasses['ctrl-button']} */ ;
/** @type {__VLS_StyleScopedClasses['ctrl-button']} */ ;
/** @type {__VLS_StyleScopedClasses['play-pause']} */ ;
/** @type {__VLS_StyleScopedClasses['ctrl-button']} */ ;
/** @type {__VLS_StyleScopedClasses['floating-player']} */ ;
/** @type {__VLS_StyleScopedClasses['is-collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['player-card']} */ ;
/** @type {__VLS_StyleScopedClasses['is-collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['player-card']} */ ;
/** @type {__VLS_StyleScopedClasses['is-collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['now-label']} */ ;
/** @type {__VLS_StyleScopedClasses['wave']} */ ;
/** @type {__VLS_StyleScopedClasses['vinyl-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['player-card']} */ ;
/** @type {__VLS_StyleScopedClasses['is-collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['vinyl-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['aura']} */ ;
/** @type {__VLS_StyleScopedClasses['floating-player']} */ ;
/** @type {__VLS_StyleScopedClasses['is-collapsed']} */ ;
/** @type {__VLS_StyleScopedClasses['aura']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    name: "player-rise",
}));
const __VLS_2 = __VLS_1({
    name: "player-rise",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
if (__VLS_ctx.musicPlayer.isVisible) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "floating-player" },
        ...{ class: ({ 'is-collapsed': __VLS_ctx.isCollapsed }) },
        role: "region",
        'aria-label': (__VLS_ctx.isCollapsed ? '音乐播放器（已收起，点击展开）' : '正在播放'),
    });
    /** @type {__VLS_StyleScopedClasses['floating-player']} */ ;
    /** @type {__VLS_StyleScopedClasses['is-collapsed']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "aura" },
        ...{ class: ({ 'is-playing': __VLS_ctx.musicPlayer.isPlaying }) },
    });
    /** @type {__VLS_StyleScopedClasses['aura']} */ ;
    /** @type {__VLS_StyleScopedClasses['is-playing']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
        ...{ class: "aura-ring aura-ring-1" },
    });
    /** @type {__VLS_StyleScopedClasses['aura-ring']} */ ;
    /** @type {__VLS_StyleScopedClasses['aura-ring-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
        ...{ class: "aura-ring aura-ring-2" },
    });
    /** @type {__VLS_StyleScopedClasses['aura-ring']} */ ;
    /** @type {__VLS_StyleScopedClasses['aura-ring-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
        ...{ class: "aura-ring aura-ring-3" },
    });
    /** @type {__VLS_StyleScopedClasses['aura-ring']} */ ;
    /** @type {__VLS_StyleScopedClasses['aura-ring-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "player-card" },
        ...{ class: ({ 'is-collapsed': __VLS_ctx.isCollapsed }) },
    });
    /** @type {__VLS_StyleScopedClasses['player-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['is-collapsed']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.handleVinylClick) },
        ...{ class: "vinyl-wrapper" },
        title: (__VLS_ctx.isCollapsed ? '点击展开播放器' : undefined),
    });
    /** @type {__VLS_StyleScopedClasses['vinyl-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "vinyl" },
        ...{ class: ({ 'is-playing': __VLS_ctx.musicPlayer.isPlaying }) },
    });
    /** @type {__VLS_StyleScopedClasses['vinyl']} */ ;
    /** @type {__VLS_StyleScopedClasses['is-playing']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: "vinyl-grooves" },
    });
    /** @type {__VLS_StyleScopedClasses['vinyl-grooves']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "vinyl-cover" },
        ...{ style: (__VLS_ctx.musicPlayer.currentCover ? { backgroundImage: `url(${__VLS_ctx.musicPlayer.currentCover})` } : {}) },
    });
    /** @type {__VLS_StyleScopedClasses['vinyl-cover']} */ ;
    if (!__VLS_ctx.musicPlayer.currentCover) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "vinyl-note" },
        });
        /** @type {__VLS_StyleScopedClasses['vinyl-note']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: "vinyl-center" },
    });
    /** @type {__VLS_StyleScopedClasses['vinyl-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: "vinyl-arm" },
        ...{ class: ({ 'is-playing': __VLS_ctx.musicPlayer.isPlaying }) },
    });
    /** @type {__VLS_StyleScopedClasses['vinyl-arm']} */ ;
    /** @type {__VLS_StyleScopedClasses['is-playing']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (!__VLS_ctx.isCollapsed) }, null, null);
    /** @type {__VLS_StyleScopedClasses['info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "title-row" },
    });
    /** @type {__VLS_StyleScopedClasses['title-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "now-label" },
    });
    /** @type {__VLS_StyleScopedClasses['now-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "title" },
        title: (__VLS_ctx.musicPlayer.currentTitle),
    });
    /** @type {__VLS_StyleScopedClasses['title']} */ ;
    (__VLS_ctx.musicPlayer.currentTitle);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "progress-row" },
    });
    /** @type {__VLS_StyleScopedClasses['progress-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "time" },
    });
    /** @type {__VLS_StyleScopedClasses['time']} */ ;
    (__VLS_ctx.currentTimeText);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "progress-track-wrap" },
    });
    /** @type {__VLS_StyleScopedClasses['progress-track-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "progress-track" },
    });
    /** @type {__VLS_StyleScopedClasses['progress-track']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: "progress-fill" },
        ...{ style: ({ width: `${__VLS_ctx.musicPlayer.progress}%` }) },
    });
    /** @type {__VLS_StyleScopedClasses['progress-fill']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: "progress-thumb" },
        ...{ style: ({ left: `${__VLS_ctx.musicPlayer.progress}%` }) },
    });
    /** @type {__VLS_StyleScopedClasses['progress-thumb']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.handleSeek) },
        type: "range",
        min: "0",
        max: "100",
        step: "0.1",
        value: (__VLS_ctx.musicPlayer.progress),
        ...{ class: "progress-input" },
        'aria-label': "播放进度",
    });
    /** @type {__VLS_StyleScopedClasses['progress-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "time" },
    });
    /** @type {__VLS_StyleScopedClasses['time']} */ ;
    (__VLS_ctx.durationText);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "wave" },
        ...{ class: ({ 'is-playing': __VLS_ctx.musicPlayer.isPlaying }) },
        'aria-hidden': "true",
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (!__VLS_ctx.isCollapsed) }, null, null);
    /** @type {__VLS_StyleScopedClasses['wave']} */ ;
    /** @type {__VLS_StyleScopedClasses['is-playing']} */ ;
    for (const [i] of __VLS_vFor((__VLS_ctx.waveBars))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
            key: (i),
            ...{ class: "wave-bar" },
            ...{ style: ({ animationDelay: `${i * 0.12}s` }) },
        });
        /** @type {__VLS_StyleScopedClasses['wave-bar']} */ ;
        // @ts-ignore
        [musicPlayer, musicPlayer, musicPlayer, musicPlayer, musicPlayer, musicPlayer, musicPlayer, musicPlayer, musicPlayer, musicPlayer, musicPlayer, musicPlayer, musicPlayer, isCollapsed, isCollapsed, isCollapsed, isCollapsed, isCollapsed, isCollapsed, handleVinylClick, currentTimeText, handleSeek, durationText, waveBars,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "controls" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (!__VLS_ctx.isCollapsed) }, null, null);
    /** @type {__VLS_StyleScopedClasses['controls']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleToggle) },
        ...{ class: "ctrl-button play-pause" },
        'aria-label': (__VLS_ctx.musicPlayer.isPlaying ? '暂停' : '播放'),
    });
    /** @type {__VLS_StyleScopedClasses['ctrl-button']} */ ;
    /** @type {__VLS_StyleScopedClasses['play-pause']} */ ;
    if (__VLS_ctx.musicPlayer.isPlaying) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            ...{ class: "icon" },
        });
        /** @type {__VLS_StyleScopedClasses['icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
            x: "6",
            y: "5",
            width: "4",
            height: "14",
            rx: "1",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
            x: "14",
            y: "5",
            width: "4",
            height: "14",
            rx: "1",
        });
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            ...{ class: "icon" },
        });
        /** @type {__VLS_StyleScopedClasses['icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M8 5v14l11-7z",
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleCollapse) },
        ...{ class: "ctrl-button btn-collapse" },
        'aria-label': "收起播放器",
    });
    /** @type {__VLS_StyleScopedClasses['ctrl-button']} */ ;
    /** @type {__VLS_StyleScopedClasses['btn-collapse']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        ...{ class: "icon" },
    });
    /** @type {__VLS_StyleScopedClasses['icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M6 9l6 6 6-6",
        stroke: "currentColor",
        'stroke-width': "2",
        fill: "none",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleClose) },
        ...{ class: "ctrl-button close" },
        'aria-label': "关闭播放器",
    });
    /** @type {__VLS_StyleScopedClasses['ctrl-button']} */ ;
    /** @type {__VLS_StyleScopedClasses['close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        ...{ class: "icon" },
    });
    /** @type {__VLS_StyleScopedClasses['icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M6 6l12 12M18 6L6 18",
        stroke: "currentColor",
        'stroke-width': "2",
        fill: "none",
        'stroke-linecap': "round",
    });
}
// @ts-ignore
[musicPlayer, musicPlayer, isCollapsed, handleToggle, handleCollapse, handleClose,];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
