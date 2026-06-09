/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { cn } from "@/lib/utils";
import { ref } from "vue";
const props = withDefaults(defineProps(), {
    height: undefined,
    width: undefined,
    class: "",
    alt: "Background of a beautiful view",
    fill: false,
});
const isLoading = ref(true);
function handleLoad() {
    isLoading.value = false;
}
const __VLS_defaults = {
    height: undefined,
    width: undefined,
    class: "",
    alt: "Background of a beautiful view",
    fill: false,
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
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    ...{ onLoad: (__VLS_ctx.handleLoad) },
    src: (__VLS_ctx.src),
    width: (__VLS_ctx.width),
    height: (__VLS_ctx.height),
    loading: "lazy",
    decoding: "async",
    alt: (__VLS_ctx.alt),
    ...{ class: (__VLS_ctx.cn(`transition duration-300`, __VLS_ctx.isLoading ? 'blur-sm' : 'blur-0', props.class, __VLS_ctx.fill ? 'h-full w-full' : '')) },
});
// @ts-ignore
[handleLoad, src, width, height, alt, cn, isLoading, fill,];
const __VLS_export = (await import('vue')).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
