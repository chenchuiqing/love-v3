/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onClickOutside } from "@vueuse/core";
import { AnimatePresence, Motion } from "motion-v";
import { inject, onMounted, onUnmounted, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { CarouselKey } from "./AppleCarouselContext";
const props = withDefaults(defineProps(), {
    layout: false,
    hidePreviewText: false,
});
const open = ref(false);
const containerRef = ref(null);
const carouselContext = inject(CarouselKey);
if (!carouselContext) {
    throw new Error("Card must be used within a Carousel");
}
const { onCardClose } = carouselContext;
function handleKeyDown(event) {
    if (event.key === "Escape") {
        handleClose();
    }
}
onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
});
onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
});
watch(open, (newVal) => {
    if (newVal) {
        document.body.style.overflow = "hidden";
    }
    else {
        document.body.style.overflow = "auto";
    }
});
onClickOutside(containerRef, () => handleClose());
function handleOpen() {
    open.value = true;
}
function handleClose() {
    open.value = false;
    onCardClose(props.index);
}
const __VLS_defaults = {
    layout: false,
    hidePreviewText: false,
};
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.Teleport | typeof __VLS_components.Teleport} */
Teleport;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "body",
}));
const __VLS_2 = __VLS_1({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
let __VLS_6;
/** @ts-ignore @type { | typeof __VLS_components.AnimatePresence | typeof __VLS_components.AnimatePresence} */
AnimatePresence;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_11 } = __VLS_9.slots;
if (__VLS_ctx.open) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "fixed inset-0 z-50 h-screen overflow-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
    let __VLS_12;
    /** @ts-ignore @type { | typeof __VLS_components.Motion} */
    Motion;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        as: "div",
        initial: ({ opacity: 0 }),
        animate: ({ opacity: 1 }),
        exit: ({ opacity: 0 }),
        ...{ class: "fixed inset-0 size-full bg-black/80 backdrop-blur-lg" },
    }));
    const __VLS_14 = __VLS_13({
        as: "div",
        initial: ({ opacity: 0 }),
        animate: ({ opacity: 1 }),
        exit: ({ opacity: 0 }),
        ...{ class: "fixed inset-0 size-full bg-black/80 backdrop-blur-lg" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-black/80']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur-lg']} */ ;
    let __VLS_17;
    /** @ts-ignore @type { | typeof __VLS_components.Motion | typeof __VLS_components.Motion} */
    Motion;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        ref: "containerRef",
        as: "div",
        initial: ({ opacity: 0 }),
        animate: ({ opacity: 1 }),
        exit: ({ opacity: 0 }),
        layoutId: (__VLS_ctx.layout ? `card-${__VLS_ctx.card.title}` : undefined),
        ...{ class: "relative z-60 mx-auto my-10 h-fit max-w-5xl rounded-3xl bg-white p-4 font-sans md:p-10 dark:bg-neutral-900" },
    }));
    const __VLS_19 = __VLS_18({
        ref: "containerRef",
        as: "div",
        initial: ({ opacity: 0 }),
        animate: ({ opacity: 1 }),
        exit: ({ opacity: 0 }),
        layoutId: (__VLS_ctx.layout ? `card-${__VLS_ctx.card.title}` : undefined),
        ...{ class: "relative z-60 mx-auto my-10 h-fit max-w-5xl rounded-3xl bg-white p-4 font-sans md:p-10 dark:bg-neutral-900" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_18));
    var __VLS_22;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-60']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['my-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-fit']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-5xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-sans']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:p-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-neutral-900']} */ ;
    const { default: __VLS_24 } = __VLS_20.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleClose) },
        ...{ class: "sticky top-4 right-0 ml-auto flex size-8 items-center justify-center rounded-full bg-black dark:bg-white" },
    });
    /** @type {__VLS_StyleScopedClasses['sticky']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['right-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-white']} */ ;
    let __VLS_25;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
        icon: "tabler:x",
        ...{ class: "size-6 text-neutral-100 dark:text-neutral-900" },
    }));
    const __VLS_27 = __VLS_26({
        icon: "tabler:x",
        ...{ class: "size-6 text-neutral-100 dark:text-neutral-900" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-neutral-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-neutral-900']} */ ;
    let __VLS_30;
    /** @ts-ignore @type { | typeof __VLS_components.Motion | typeof __VLS_components.Motion} */
    Motion;
    // @ts-ignore
    const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
        as: "div",
        layoutId: (__VLS_ctx.layout ? `category-${__VLS_ctx.card.title}` : undefined),
        ...{ class: "text-base font-medium text-black dark:text-white" },
    }));
    const __VLS_32 = __VLS_31({
        as: "div",
        layoutId: (__VLS_ctx.layout ? `category-${__VLS_ctx.card.title}` : undefined),
        ...{ class: "text-base font-medium text-black dark:text-white" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_31));
    /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-black']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-white']} */ ;
    const { default: __VLS_35 } = __VLS_33.slots;
    (__VLS_ctx.card.category);
    // @ts-ignore
    [open, layout, layout, card, card, card, handleClose,];
    var __VLS_33;
    let __VLS_36;
    /** @ts-ignore @type { | typeof __VLS_components.Motion | typeof __VLS_components.Motion} */
    Motion;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        as: "div",
        layoutId: (__VLS_ctx.layout ? `title-${__VLS_ctx.card.title}` : undefined),
        ...{ class: "mt-4 text-2xl font-semibold text-neutral-700 md:text-5xl dark:text-white" },
    }));
    const __VLS_38 = __VLS_37({
        as: "div",
        layoutId: (__VLS_ctx.layout ? `title-${__VLS_ctx.card.title}` : undefined),
        ...{ class: "mt-4 text-2xl font-semibold text-neutral-700 md:text-5xl dark:text-white" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-neutral-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:text-5xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-white']} */ ;
    const { default: __VLS_41 } = __VLS_39.slots;
    (__VLS_ctx.card.title);
    // @ts-ignore
    [layout, card, card,];
    var __VLS_39;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-10" },
    });
    /** @type {__VLS_StyleScopedClasses['py-10']} */ ;
    var __VLS_42 = {};
    // @ts-ignore
    [];
    var __VLS_20;
}
// @ts-ignore
[];
var __VLS_9;
// @ts-ignore
[];
var __VLS_3;
let __VLS_44;
/** @ts-ignore @type { | typeof __VLS_components.Motion | typeof __VLS_components.Motion} */
Motion;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
    ...{ 'onClick': {} },
    layoutId: (__VLS_ctx.layout ? `card-${__VLS_ctx.card.title}` : undefined),
    ...{ class: "relative z-10 flex h-64 w-44 flex-col items-start justify-start overflow-hidden rounded-3xl bg-gray-100 md:h-[24rem] md:w-[16rem] dark:bg-neutral-900" },
}));
const __VLS_46 = __VLS_45({
    ...{ 'onClick': {} },
    layoutId: (__VLS_ctx.layout ? `card-${__VLS_ctx.card.title}` : undefined),
    ...{ class: "relative z-10 flex h-64 w-44 flex-col items-start justify-start overflow-hidden rounded-3xl bg-gray-100 md:h-[24rem] md:w-[16rem] dark:bg-neutral-900" },
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
let __VLS_49;
const __VLS_50 = {
    ...{ click: {} },
    onClick: (__VLS_ctx.handleOpen),
};
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-64']} */ ;
/** @type {__VLS_StyleScopedClasses['w-44']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-start']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['md:h-[24rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['md:w-[16rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-neutral-900']} */ ;
const { default: __VLS_51 } = __VLS_47.slots;
if (!__VLS_ctx.hidePreviewText) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: "pointer-events-none absolute inset-x-0 top-0 z-30 h-full bg-linear-to-b from-black/50 via-transparent to-transparent" },
    });
    /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-30']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-linear-to-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['from-black/50']} */ ;
    /** @type {__VLS_StyleScopedClasses['via-transparent']} */ ;
    /** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "relative z-40 p-8" },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-40']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-8']} */ ;
    let __VLS_52;
    /** @ts-ignore @type { | typeof __VLS_components.Motion | typeof __VLS_components.Motion} */
    Motion;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
        layoutId: (__VLS_ctx.layout ? `category-${__VLS_ctx.card.category}` : undefined),
        ...{ class: "text-left font-sans text-sm font-medium text-white md:text-base" },
    }));
    const __VLS_54 = __VLS_53({
        layoutId: (__VLS_ctx.layout ? `category-${__VLS_ctx.card.category}` : undefined),
        ...{ class: "text-left font-sans text-sm font-medium text-white md:text-base" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-sans']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:text-base']} */ ;
    const { default: __VLS_57 } = __VLS_55.slots;
    (__VLS_ctx.card.category);
    // @ts-ignore
    [layout, layout, card, card, card, handleOpen, hidePreviewText,];
    var __VLS_55;
    let __VLS_58;
    /** @ts-ignore @type { | typeof __VLS_components.Motion | typeof __VLS_components.Motion} */
    Motion;
    // @ts-ignore
    const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
        layoutId: (__VLS_ctx.layout ? `title-${__VLS_ctx.card.title}` : undefined),
        ...{ class: "mt-2 max-w-xs text-left font-sans text-xl font-semibold text-balance text-white md:text-3xl" },
    }));
    const __VLS_60 = __VLS_59({
        layoutId: (__VLS_ctx.layout ? `title-${__VLS_ctx.card.title}` : undefined),
        ...{ class: "mt-2 max-w-xs text-left font-sans text-xl font-semibold text-balance text-white md:text-3xl" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_59));
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-sans']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-balance']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:text-3xl']} */ ;
    const { default: __VLS_63 } = __VLS_61.slots;
    (__VLS_ctx.card.title);
    // @ts-ignore
    [layout, card, card,];
    var __VLS_61;
}
if (__VLS_ctx.card.mediaType === 'video') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.video)({
        src: (__VLS_ctx.card.src),
        ...{ class: "absolute inset-0 z-10 h-full w-full object-cover" },
        muted: true,
        loop: true,
        autoplay: true,
        playsinline: true,
        preload: "metadata",
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_ctx.card.src),
        alt: (__VLS_ctx.card.title),
        ...{ class: "absolute inset-0 z-10 h-full w-full object-cover" },
        loading: "lazy",
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
}
// @ts-ignore
[card, card, card, card,];
var __VLS_47;
var __VLS_48;
// @ts-ignore
var __VLS_23 = __VLS_22, __VLS_43 = __VLS_42;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
const __VLS_export = {};
export default {};
