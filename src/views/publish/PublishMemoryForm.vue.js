/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import { createPublishMemory, fetchPublishMemories, fetchPublishMemoryById, updatePublishMemory, uploadPublishMedia, } from '@/api/memories';
import MemoryDetail from '@/components/MemoryDetail.vue';
import MemoryPlanet from '@/components/MemoryPlanet.vue';
const MAX_IMAGE_COUNT = 5;
const route = useRoute();
const router = useRouter();
const memoryTypeOptions = [
    { value: 'photo', label: '照片' },
    { value: 'date', label: '纪念日' },
    { value: 'chat', label: '对话' },
    { value: 'location', label: '地点' },
    { value: 'music', label: '音乐' },
];
const particleThemeOptions = [
    { value: 'default', label: '默认' },
    { value: 'ocean', label: '海洋' },
    { value: 'forest', label: '森林' },
    { value: 'city', label: '城市' },
    { value: 'sky', label: '晴空' },
    { value: 'summit', label: '山野登山' },
    { value: 'sunshine', label: '暖阳' },
    { value: 'meadow', label: '草地春光' },
    { value: 'night', label: '夜景' },
    { value: 'fireworks', label: '烟花' },
    { value: 'moonlight', label: '月光' },
    { value: 'neon', label: '霓虹' },
];
const DEFAULT_COLOR_PALETTE = ['#42A5F5', '#EF5350', '#26C6DA', '#EC407A', '#66BB6A', '#5C6BC0', '#FFB300', '#AB47BC'];
const randomColor = () => {
    const base = DEFAULT_COLOR_PALETTE[Math.floor(Math.random() * DEFAULT_COLOR_PALETTE.length)];
    const r = parseInt(base.slice(1, 3), 16);
    const g = parseInt(base.slice(3, 5), 16);
    const b = parseInt(base.slice(5, 7), 16);
    const vary = () => Math.round((Math.random() - 0.5) * 50);
    const clamp = (n) => Math.max(0, Math.min(255, n));
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(clamp(r + vary()))}${toHex(clamp(g + vary()))}${toHex(clamp(b + vary()))}`;
};
const form = reactive({
    type: 'photo',
    title: '',
    date: '',
    color: randomColor(),
    theta: 1.8,
    phi: 1.2,
    orbitRadius: 1.08,
    text: '',
    imageUrl: '',
    imageUrls: [],
    audioUrl: '',
    videoUrl: '',
    location: '',
    theme: 'default',
});
const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const isUploadingImage = ref(false);
const isUploadingAudio = ref(false);
const isUploadingVideo = ref(false);
const previewErrorMessage = ref('');
const previewCatalog = ref([]);
const previewDetailMemory = ref(null);
const isEditMode = computed(() => typeof route.params.id === 'string' && route.params.id.length > 0);
const currentId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''));
const previewFormMemory = computed(() => {
    const imageUrls = getSanitizedImageUrls();
    const fallbackImageUrl = form.imageUrl.trim();
    const resolvedImageUrl = imageUrls[0] ?? fallbackImageUrl;
    return {
        id: currentId.value || '__preview_draft__',
        type: form.type,
        title: form.title || '未命名记忆点',
        date: form.date || '待填写日期',
        color: form.color || '#6AA0FF',
        orbitRadius: Number(form.orbitRadius) || 1.08,
        position: {
            theta: Number(form.theta) || 0,
            phi: Number(form.phi) || 0,
        },
        content: {
            text: form.text || undefined,
            imageUrl: resolvedImageUrl || undefined,
            imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
            audioUrl: form.audioUrl || undefined,
            videoUrl: form.videoUrl || undefined,
            location: form.location || undefined,
            theme: form.theme || undefined,
        },
    };
});
const previewPlanetMemories = computed(() => {
    const catalogWithoutCurrent = previewCatalog.value.filter((item) => item.id !== previewFormMemory.value.id);
    return [...catalogWithoutCurrent, previewFormMemory.value];
});
const getSanitizedImageUrls = () => {
    const urls = form.imageUrls.map((url) => url.trim()).filter((url) => url.length > 0);
    return urls.slice(0, MAX_IMAGE_COUNT);
};
const applyMemoryToForm = (memory) => {
    form.type = memory.type;
    form.title = memory.title;
    form.date = memory.date;
    form.color = memory.color;
    form.theta = memory.position.theta;
    form.phi = memory.position.phi;
    form.orbitRadius = memory.orbitRadius;
    form.text = memory.content.text ?? '';
    const loadedImageUrls = memory.content.imageUrls?.filter((url) => url.trim().length > 0).slice(0, MAX_IMAGE_COUNT) ?? [];
    form.imageUrls = loadedImageUrls.length > 0 ? loadedImageUrls : (memory.content.imageUrl ? [memory.content.imageUrl] : []);
    form.imageUrl = memory.content.imageUrl ?? loadedImageUrls[0] ?? '';
    form.audioUrl = memory.content.audioUrl ?? '';
    form.videoUrl = memory.content.videoUrl ?? '';
    form.location = memory.content.location ?? '';
    form.theme = memory.content.theme ?? 'default';
};
const buildPayload = () => {
    const imageUrls = getSanitizedImageUrls();
    const fallbackImageUrl = form.imageUrl.trim();
    const resolvedImageUrl = imageUrls[0] ?? fallbackImageUrl;
    return {
        type: form.type,
        title: form.title,
        date: form.date,
        color: form.color,
        orbitRadius: Number(form.orbitRadius),
        position: {
            theta: Number(form.theta),
            phi: Number(form.phi),
        },
        content: {
            text: form.text || undefined,
            imageUrl: resolvedImageUrl || undefined,
            imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
            audioUrl: form.audioUrl || undefined,
            videoUrl: form.videoUrl || undefined,
            location: form.location || undefined,
            theme: form.theme || undefined,
        },
    };
};
const loadPreviewCatalog = async () => {
    previewErrorMessage.value = '';
    try {
        previewCatalog.value = await fetchPublishMemories();
    }
    catch (error) {
        if (error instanceof Error) {
            previewErrorMessage.value = error.message;
            return;
        }
        previewErrorMessage.value = '预览列表加载失败';
    }
};
const refillAutoPosition = () => {
    form.theta = Number((Math.random() * Math.PI * 2).toFixed(4));
    form.phi = Number((Math.random() * Math.PI).toFixed(4));
    form.orbitRadius = Number((1.05 + Math.random() * 0.1).toFixed(4));
};
const uploadFile = async (file, target) => {
    errorMessage.value = '';
    successMessage.value = '';
    if (target === 'audio') {
        isUploadingAudio.value = true;
    }
    else {
        isUploadingVideo.value = true;
    }
    try {
        const url = await uploadPublishMedia(file);
        if (target === 'audio') {
            form.audioUrl = url;
        }
        else {
            form.videoUrl = url;
        }
        const targetLabel = target === 'audio' ? '音频' : '视频';
        successMessage.value = `${targetLabel}上传成功，链接已自动填入表单`;
    }
    catch (error) {
        successMessage.value = '';
        if (error instanceof Error) {
            errorMessage.value = error.message;
        }
        else {
            errorMessage.value = '上传失败';
        }
    }
    finally {
        if (target === 'audio') {
            isUploadingAudio.value = false;
        }
        else {
            isUploadingVideo.value = false;
        }
    }
};
const handleUploadImage = async (event) => {
    const input = event.target;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length === 0)
        return;
    errorMessage.value = '';
    successMessage.value = '';
    const existing = getSanitizedImageUrls();
    const remain = MAX_IMAGE_COUNT - existing.length;
    if (remain <= 0) {
        errorMessage.value = `最多只能上传 ${MAX_IMAGE_COUNT} 张图片`;
        input.value = '';
        return;
    }
    const selected = files.slice(0, remain);
    isUploadingImage.value = true;
    try {
        const uploaded = [];
        for (const file of selected) {
            const url = await uploadPublishMedia(file);
            if (!existing.includes(url) && !uploaded.includes(url)) {
                uploaded.push(url);
            }
        }
        form.imageUrls = [...existing, ...uploaded].slice(0, MAX_IMAGE_COUNT);
        form.imageUrl = form.imageUrls[0] ?? '';
        if (uploaded.length > 0) {
            successMessage.value = `图片上传成功，已新增 ${uploaded.length} 张`;
        }
        else {
            successMessage.value = '图片已存在，未新增';
        }
        if (files.length > selected.length) {
            successMessage.value += `（最多保留 ${MAX_IMAGE_COUNT} 张）`;
        }
    }
    catch (error) {
        successMessage.value = '';
        if (error instanceof Error) {
            errorMessage.value = error.message;
        }
        else {
            errorMessage.value = '图片上传失败';
        }
    }
    finally {
        isUploadingImage.value = false;
        input.value = '';
    }
};
const handleUploadAudio = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file)
        return;
    await uploadFile(file, 'audio');
};
const handleUploadVideo = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file)
        return;
    await uploadFile(file, 'video');
};
const removeImageAt = (index) => {
    if (index < 0 || index >= form.imageUrls.length)
        return;
    form.imageUrls = form.imageUrls.filter((_, idx) => idx !== index);
    form.imageUrl = form.imageUrls[0] ?? '';
};
const clearAudio = () => {
    form.audioUrl = '';
};
const clearVideo = () => {
    form.videoUrl = '';
};
const handleSubmit = async () => {
    errorMessage.value = '';
    if (!form.title.trim()) {
        errorMessage.value = '请填写标题';
        return;
    }
    if (!form.date.trim()) {
        errorMessage.value = '请填写日期';
        return;
    }
    submitting.value = true;
    try {
        if (isEditMode.value) {
            await updatePublishMemory(currentId.value, buildPayload());
        }
        else {
            await createPublishMemory(buildPayload());
        }
        await router.push({ name: 'PublishMemoryList' });
    }
    catch (error) {
        if (error instanceof ApiError && error.status === 409) {
            errorMessage.value = '保存失败，请稍后重试';
            return;
        }
        if (error instanceof Error) {
            errorMessage.value = error.message;
        }
        else {
            errorMessage.value = '保存失败';
        }
    }
    finally {
        submitting.value = false;
    }
};
const handlePreviewNodeClick = (memory) => {
    previewDetailMemory.value = memory;
};
const openCurrentDetailPreview = () => {
    previewDetailMemory.value = previewFormMemory.value;
};
onMounted(async () => {
    await loadPreviewCatalog();
    if (!isEditMode.value) {
        refillAutoPosition();
        return;
    }
    loading.value = true;
    try {
        const memory = await fetchPublishMemoryById(currentId.value);
        applyMemoryToForm(memory);
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
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-field']} */ ;
/** @type {__VLS_StyleScopedClasses['advanced']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-head']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-result']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['layout']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "panel" },
});
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "hint" },
    });
    /** @type {__VLS_StyleScopedClasses['hint']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "layout" },
    });
    /** @type {__VLS_StyleScopedClasses['layout']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.handleSubmit) },
        ...{ class: "form" },
    });
    /** @type {__VLS_StyleScopedClasses['form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "field-label" },
    });
    /** @type {__VLS_StyleScopedClasses['field-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        required: true,
    });
    (__VLS_ctx.form.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "row" },
    });
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.type),
    });
    for (const [item] of __VLS_vFor((__VLS_ctx.memoryTypeOptions))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (item.value),
            value: (item.value),
        });
        (item.label);
        // @ts-ignore
        [loading, handleSubmit, form, form, memoryTypeOptions,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "field-label" },
    });
    /** @type {__VLS_StyleScopedClasses['field-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        required: true,
        placeholder: "例如 2025-05-20",
    });
    (__VLS_ctx.form.date);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "row" },
    });
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "color",
    });
    (__VLS_ctx.form.color);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.form.theme),
    });
    for (const [item] of __VLS_vFor((__VLS_ctx.particleThemeOptions))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (item.value),
            value: (item.value),
        });
        (item.label);
        // @ts-ignore
        [form, form, form, particleThemeOptions,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.form.text),
        rows: "4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({});
    (__VLS_ctx.form.location);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "upload-row" },
    });
    /** @type {__VLS_StyleScopedClasses['upload-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "upload-field" },
    });
    /** @type {__VLS_StyleScopedClasses['upload-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.handleUploadImage) },
        type: "file",
        accept: "image/*",
        multiple: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "upload-field" },
    });
    /** @type {__VLS_StyleScopedClasses['upload-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.handleUploadAudio) },
        type: "file",
        accept: "audio/mpeg,audio/mp3",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "upload-field" },
    });
    /** @type {__VLS_StyleScopedClasses['upload-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.handleUploadVideo) },
        type: "file",
        accept: "video/*",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.fieldset, __VLS_intrinsics.fieldset)({
        ...{ class: "advanced" },
    });
    /** @type {__VLS_StyleScopedClasses['advanced']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.legend, __VLS_intrinsics.legend)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "row" },
    });
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        step: "0.0001",
    });
    (__VLS_ctx.form.theta);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        step: "0.0001",
    });
    (__VLS_ctx.form.phi);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        step: "0.0001",
    });
    (__VLS_ctx.form.orbitRadius);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.refillAutoPosition) },
        type: "button",
    });
    if (__VLS_ctx.errorMessage) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "error" },
        });
        /** @type {__VLS_StyleScopedClasses['error']} */ ;
        (__VLS_ctx.errorMessage);
    }
    if (__VLS_ctx.successMessage) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "success" },
        });
        /** @type {__VLS_StyleScopedClasses['success']} */ ;
        (__VLS_ctx.successMessage);
    }
    if (__VLS_ctx.isUploadingImage || __VLS_ctx.isUploadingAudio || __VLS_ctx.isUploadingVideo) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "hint" },
        });
        /** @type {__VLS_StyleScopedClasses['hint']} */ ;
        (__VLS_ctx.isUploadingImage ? '图片上传中...' : '');
        (__VLS_ctx.isUploadingAudio ? '音频上传中...' : '');
        (__VLS_ctx.isUploadingVideo ? '视频上传中...' : '');
    }
    if (__VLS_ctx.form.imageUrl || __VLS_ctx.form.audioUrl || __VLS_ctx.form.videoUrl || __VLS_ctx.getSanitizedImageUrls().length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "upload-result" },
        });
        /** @type {__VLS_StyleScopedClasses['upload-result']} */ ;
        if (__VLS_ctx.getSanitizedImageUrls().length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "media-block" },
            });
            /** @type {__VLS_StyleScopedClasses['media-block']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "hint" },
            });
            /** @type {__VLS_StyleScopedClasses['hint']} */ ;
            (__VLS_ctx.getSanitizedImageUrls().length);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "media-list" },
            });
            /** @type {__VLS_StyleScopedClasses['media-list']} */ ;
            for (const [url, index] of __VLS_vFor((__VLS_ctx.getSanitizedImageUrls()))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (`${url}-${index}`),
                    ...{ class: "media-item" },
                });
                /** @type {__VLS_StyleScopedClasses['media-item']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "hint media-url" },
                });
                /** @type {__VLS_StyleScopedClasses['hint']} */ ;
                /** @type {__VLS_StyleScopedClasses['media-url']} */ ;
                (url);
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!(__VLS_ctx.form.imageUrl || __VLS_ctx.form.audioUrl || __VLS_ctx.form.videoUrl || __VLS_ctx.getSanitizedImageUrls().length > 0))
                                return;
                            if (!(__VLS_ctx.getSanitizedImageUrls().length > 0))
                                return;
                            __VLS_ctx.removeImageAt(index);
                            // @ts-ignore
                            [form, form, form, form, form, form, form, form, handleUploadImage, handleUploadAudio, handleUploadVideo, refillAutoPosition, errorMessage, errorMessage, successMessage, successMessage, isUploadingImage, isUploadingImage, isUploadingAudio, isUploadingAudio, isUploadingVideo, isUploadingVideo, getSanitizedImageUrls, getSanitizedImageUrls, getSanitizedImageUrls, getSanitizedImageUrls, removeImageAt,];
                        } },
                    type: "button",
                    ...{ class: "danger-button" },
                });
                /** @type {__VLS_StyleScopedClasses['danger-button']} */ ;
                // @ts-ignore
                [];
            }
        }
        if (__VLS_ctx.form.audioUrl) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "media-block" },
            });
            /** @type {__VLS_StyleScopedClasses['media-block']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "hint" },
            });
            /** @type {__VLS_StyleScopedClasses['hint']} */ ;
            (__VLS_ctx.form.audioUrl);
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.clearAudio) },
                type: "button",
                ...{ class: "danger-button" },
            });
            /** @type {__VLS_StyleScopedClasses['danger-button']} */ ;
        }
        if (__VLS_ctx.form.videoUrl) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "media-block" },
            });
            /** @type {__VLS_StyleScopedClasses['media-block']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "hint" },
            });
            /** @type {__VLS_StyleScopedClasses['hint']} */ ;
            (__VLS_ctx.form.videoUrl);
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.clearVideo) },
                type: "button",
                ...{ class: "danger-button" },
            });
            /** @type {__VLS_StyleScopedClasses['danger-button']} */ ;
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "footer" },
    });
    /** @type {__VLS_StyleScopedClasses['footer']} */ ;
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        to: ({ name: 'PublishMemoryList' }),
    }));
    const __VLS_2 = __VLS_1({
        to: ({ name: 'PublishMemoryList' }),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_5 } = __VLS_3.slots;
    // @ts-ignore
    [form, form, form, form, clearAudio, clearVideo,];
    var __VLS_3;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        disabled: (__VLS_ctx.submitting),
    });
    (__VLS_ctx.submitting
        ? '保存中...'
        : __VLS_ctx.isEditMode
            ? '保存修改'
            : '确定新增');
    __VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
        ...{ class: "preview-panel" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-panel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-head" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-head']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openCurrentDetailPreview) },
        type: "button",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "hint" },
    });
    /** @type {__VLS_StyleScopedClasses['hint']} */ ;
    if (__VLS_ctx.previewErrorMessage) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "error" },
        });
        /** @type {__VLS_StyleScopedClasses['error']} */ ;
        (__VLS_ctx.previewErrorMessage);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "planet-preview" },
    });
    /** @type {__VLS_StyleScopedClasses['planet-preview']} */ ;
    const __VLS_6 = MemoryPlanet;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        ...{ 'onNodeClick': {} },
        phase: "exploring",
        memories: (__VLS_ctx.previewPlanetMemories),
        activeMemory: (__VLS_ctx.previewDetailMemory),
        skipForming: (true),
    }));
    const __VLS_8 = __VLS_7({
        ...{ 'onNodeClick': {} },
        phase: "exploring",
        memories: (__VLS_ctx.previewPlanetMemories),
        activeMemory: (__VLS_ctx.previewDetailMemory),
        skipForming: (true),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    let __VLS_11;
    const __VLS_12 = {
        ...{ nodeClick: {} },
        onNodeClick: (__VLS_ctx.handlePreviewNodeClick),
    };
    var __VLS_9;
    var __VLS_10;
}
if (__VLS_ctx.previewDetailMemory) {
    const __VLS_13 = MemoryDetail;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
        ...{ 'onClose': {} },
        memory: (__VLS_ctx.previewDetailMemory),
    }));
    const __VLS_15 = __VLS_14({
        ...{ 'onClose': {} },
        memory: (__VLS_ctx.previewDetailMemory),
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    let __VLS_18;
    const __VLS_19 = {
        ...{ close: {} },
        onClose: (...[$event]) => {
            if (!(__VLS_ctx.previewDetailMemory))
                return;
            __VLS_ctx.previewDetailMemory = null;
            // @ts-ignore
            [submitting, submitting, isEditMode, openCurrentDetailPreview, previewErrorMessage, previewErrorMessage, previewPlanetMemories, previewDetailMemory, previewDetailMemory, previewDetailMemory, previewDetailMemory, handlePreviewNodeClick,];
        },
    };
    var __VLS_16;
    var __VLS_17;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
