/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, provide, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { CarouselKey } from "./AppleCarouselContext";
const props = withDefaults(defineProps(), {
    initialScroll: 0,
    itemCount: 0,
});
const carouselRef = ref(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(true);
const currentIndex = ref(0);
onMounted(() => {
    if (carouselRef.value) {
        carouselRef.value.scrollLeft = props.initialScroll;
        checkScrollability();
    }
});
watch(() => props.initialScroll, (newVal) => {
    if (carouselRef.value) {
        carouselRef.value.scrollLeft = newVal;
        checkScrollability();
    }
});
function checkScrollability() {
    if (carouselRef.value) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.value;
        canScrollLeft.value = scrollLeft > 0;
        canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 1;
    }
}
function getScrollStep() {
    const firstItem = carouselRef.value?.querySelector(".apple-carousel-item");
    if (!firstItem) {
        return isMobile.value ? 188 : 268;
    }
    const nextItem = firstItem.nextElementSibling;
    if (!nextItem) {
        return firstItem.getBoundingClientRect().width;
    }
    return nextItem.offsetLeft - firstItem.offsetLeft;
}
function scrollLeft() {
    if (carouselRef.value) {
        carouselRef.value.scrollBy({ left: -getScrollStep(), behavior: "smooth" });
    }
}
function scrollRight() {
    if (carouselRef.value) {
        carouselRef.value.scrollBy({ left: getScrollStep(), behavior: "smooth" });
    }
}
function handleCardClose(index) {
    if (carouselRef.value) {
        const step = getScrollStep();
        const scrollPosition = step * (index + 1);
        carouselRef.value.scrollTo({
            left: scrollPosition,
            behavior: "smooth",
        });
        currentIndex.value = index;
    }
}
const isMobile = computed(() => {
    return window && window.innerWidth < 768;
});
const shouldCenterItems = computed(() => props.itemCount > 0 && props.itemCount <= 2);
provide(CarouselKey, {
    onCardClose: handleCardClose,
    currentIndex,
});
const __VLS_defaults = {
    initialScroll: 0,
    itemCount: 0,
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "relative w-full min-w-0 overflow-hidden" },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onScroll: (__VLS_ctx.checkScrollability) },
    ref: "carouselRef",
    ...{ class: "flex w-full min-w-0 overflow-x-auto overscroll-x-auto scroll-smooth py-3 [scrollbar-width:none] md:py-6" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['overscroll-x-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['scroll-smooth']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['[scrollbar-width:none]']} */ ;
/** @type {__VLS_StyleScopedClasses['md:py-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ...{ class: "pointer-events-none absolute right-0 z-1000 h-full w-[5%] overflow-hidden bg-linear-to-l" },
});
/** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-1000']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-[5%]']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-linear-to-l']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex min-w-full flex-row gap-3 px-3" },
    ...{ class: (__VLS_ctx.shouldCenterItems ? 'justify-start md:justify-center' : 'justify-start') },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
var __VLS_0 = {};
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mr-10 flex justify-end gap-2" },
});
/** @type {__VLS_StyleScopedClasses['mr-10']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.scrollLeft) },
    ...{ class: "relative z-40 flex size-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50" },
    disabled: (!__VLS_ctx.canScrollLeft),
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['z-40']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['size-10']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
let __VLS_2;
/** @ts-ignore @type { | typeof __VLS_components.Icon} */
Icon;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent1(__VLS_2, new __VLS_2({
    icon: "tabler:arrow-narrow-left",
    ...{ class: "size-6 text-gray-500" },
}));
const __VLS_4 = __VLS_3({
    icon: "tabler:arrow-narrow-left",
    ...{ class: "size-6 text-gray-500" },
}, ...__VLS_functionalComponentArgsRest(__VLS_3));
/** @type {__VLS_StyleScopedClasses['size-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.scrollRight) },
    ...{ class: "relative z-40 flex size-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50" },
    disabled: (!__VLS_ctx.canScrollRight),
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['z-40']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['size-10']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.Icon} */
Icon;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    icon: "tabler:arrow-narrow-right",
    ...{ class: "size-6 text-gray-500" },
}));
const __VLS_9 = __VLS_8({
    icon: "tabler:arrow-narrow-right",
    ...{ class: "size-6 text-gray-500" },
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
/** @type {__VLS_StyleScopedClasses['size-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0;
// @ts-ignore
[checkScrollability, shouldCenterItems, scrollLeft, canScrollLeft, scrollRight, canScrollRight,];
const __VLS_base = (await import('vue')).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
const __VLS_export = {};
export default {};
