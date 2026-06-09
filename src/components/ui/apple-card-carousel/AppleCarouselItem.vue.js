/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { Motion } from "motion-v";
const __VLS_props = withDefaults(defineProps(), {
    trailingSpace: true,
});
const __VLS_defaults = {
    trailingSpace: true,
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
/** @ts-ignore @type { | typeof __VLS_components.Motion | typeof __VLS_components.Motion} */
Motion;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    as: "div",
    initial: ({
        opacity: 0,
        y: 20,
    }),
    animate: ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            delay: 0.2 * __VLS_ctx.index,
            ease: 'easeOut',
        },
    }),
    ...{ class: "apple-carousel-item shrink-0 rounded-3xl" },
    ...{ class: (__VLS_ctx.trailingSpace ? 'last:pr-[5%] md:last:pr-[10%]' : '') },
}));
const __VLS_2 = __VLS_1({
    as: "div",
    initial: ({
        opacity: 0,
        y: 20,
    }),
    animate: ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            delay: 0.2 * __VLS_ctx.index,
            ease: 'easeOut',
        },
    }),
    ...{ class: "apple-carousel-item shrink-0 rounded-3xl" },
    ...{ class: (__VLS_ctx.trailingSpace ? 'last:pr-[5%] md:last:pr-[10%]' : '') },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5;
/** @type {__VLS_StyleScopedClasses['apple-carousel-item']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-3xl']} */ ;
const { default: __VLS_6 } = __VLS_3.slots;
var __VLS_7 = {};
// @ts-ignore
[index, trailingSpace,];
var __VLS_3;
// @ts-ignore
var __VLS_8 = __VLS_7;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
const __VLS_export = {};
export default {};
