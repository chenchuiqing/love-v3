/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/cheng/AppData/Local/Temp/bunx-953292910-vue-tsc@latest/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import * as THREE from 'three';
import { useMusicPlayerStore } from '@/stores/musicPlayer';
import { AnimatePresence, Motion } from 'motion-v';
import { Icon } from '@iconify/vue';
import { AppleCard, AppleCardCarousel, AppleCarouselItem } from '@/components/ui/apple-card-carousel';
import CommentSection from '@/components/CommentSection.vue';
const props = defineProps();
const emit = defineEmits();
const containerRef = ref(null);
const canvasRef = ref(null);
const displayedText = ref('');
const isImageLoaded = ref(false);
const isPortraitImage = ref(false);
const isImageExpanded = ref(false);
const musicPlayer = useMusicPlayerStore();
const isCurrentPlaying = computed(() => !!props.memory.content.audioUrl &&
    musicPlayer.isCurrentTrack(props.memory.content.audioUrl) &&
    musicPlayer.isPlaying);
const mediaImages = computed(() => {
    const urls = props.memory.content.imageUrls;
    if (Array.isArray(urls) && urls.length > 0) {
        return urls.filter((url) => typeof url === 'string' && url.trim().length > 0).slice(0, 5);
    }
    if (props.memory.content.imageUrl) {
        return [props.memory.content.imageUrl];
    }
    return [];
});
const mediaCards = computed(() => {
    const photoItems = mediaImages.value.map((src, index) => ({
        src,
        title: `${props.memory.title} #${index + 1}`,
        category: '回忆照片',
        mediaType: 'image',
        mediaUrl: src,
    }));
    const cards = [...photoItems];
    if (props.memory.content.videoUrl) {
        cards.push({
            src: props.memory.content.videoUrl,
            title: `${props.memory.title} · 视频`,
            category: '回忆视频',
            mediaType: 'video',
            mediaUrl: props.memory.content.videoUrl,
        });
    }
    return cards;
});
const shouldUseSingleImageLayout = computed(() => mediaImages.value.length === 1 && !props.memory.content.videoUrl);
let scene;
let camera;
let renderer;
let animationId;
let particlesMesh;
let particlePositions;
let particleOriginalPositions;
const PARTICLE_COUNT = 8000;
const themeColors = computed(() => {
    switch (props.memory.content.theme) {
        case 'ocean':
            return { primary: '#0a4a8e', secondary: '#1a6fb8', accent: '#4a90d9' };
        case 'forest':
            return { primary: '#0a4a2e', secondary: '#1a6b48', accent: '#2ecc71' };
        case 'city':
            return { primary: '#2a1a4a', secondary: '#4a2a7a', accent: '#9b59b6' };
        case 'sky':
            return { primary: '#1e6a9e', secondary: '#4a9fd4', accent: '#9ed4f5' };
        case 'summit':
            return { primary: '#1a5268', secondary: '#2d7a8c', accent: '#7ec8b8' };
        case 'sunshine':
            return { primary: '#4a5020', secondary: '#7a8040', accent: '#f0d060' };
        case 'meadow':
            return { primary: '#2a6040', secondary: '#4a9060', accent: '#b8e8a0' };
        case 'night':
            return { primary: '#05070a', secondary: '#141a22', accent: '#5a6578' };
        case 'fireworks':
            return { primary: '#07050a', secondary: '#2a1420', accent: '#e8944a' };
        case 'moonlight':
            return { primary: '#030508', secondary: '#0c1420', accent: '#a8bcd8' };
        case 'neon':
            return { primary: '#05030a', secondary: '#1a0f2e', accent: '#67e8d0' };
        default:
            return { primary: '#0a1a3a', secondary: '#1a3a6a', accent: '#4a6a9a' };
    }
});
const createParticleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(200, 220, 255, 0.6)');
    gradient.addColorStop(0.6, 'rgba(100, 150, 255, 0.2)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
};
const initParticleBackground = () => {
    if (!canvasRef.value || !containerRef.value)
        return;
    scene = new THREE.Scene();
    const color = new THREE.Color(themeColors.value.primary);
    scene.background = color;
    camera = new THREE.PerspectiveCamera(60, containerRef.value.clientWidth / containerRef.value.clientHeight, 0.1, 100);
    camera.position.z = 5;
    renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.value,
        antialias: true,
        alpha: true
    });
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const geometry = new THREE.BufferGeometry();
    particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    particleOriginalPositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const accentColor = new THREE.Color(themeColors.value.accent);
    const secondaryColor = new THREE.Color(themeColors.value.secondary);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = (Math.random() - 0.5) * 20;
        const y = (Math.random() - 0.5) * 12;
        const z = (Math.random() - 0.5) * 5;
        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;
        particleOriginalPositions[i * 3] = x;
        particleOriginalPositions[i * 3 + 1] = y;
        particleOriginalPositions[i * 3 + 2] = z;
        const mixRatio = Math.random();
        const mixedColor = accentColor.clone().lerp(secondaryColor, mixRatio);
        colors[i * 3] = mixedColor.r;
        colors[i * 3 + 1] = mixedColor.g;
        colors[i * 3 + 2] = mixedColor.b;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const texture = createParticleTexture();
    const material = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        map: texture,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);
    animateParticles();
};
const animateParticles = () => {
    animationId = requestAnimationFrame(animateParticles);
    const time = Date.now() * 0.001;
    const positions = particlesMesh.geometry.attributes.position.array;
    if (props.memory.content.theme === 'ocean') {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const originalY = particleOriginalPositions[i * 3 + 1];
            const x = particleOriginalPositions[i * 3];
            positions[i * 3 + 1] = originalY + Math.sin(time * 0.8 + x * 0.5) * 0.3;
        }
    }
    else {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const originalX = particleOriginalPositions[i * 3];
            const originalY = particleOriginalPositions[i * 3 + 1];
            positions[i * 3] = originalX + Math.sin(time * 0.3 + i * 0.01) * 0.1;
            positions[i * 3 + 1] = originalY + Math.cos(time * 0.2 + i * 0.01) * 0.05;
        }
    }
    particlesMesh.geometry.attributes.position.needsUpdate = true;
    particlesMesh.rotation.z = Math.sin(time * 0.1) * 0.02;
    renderer.render(scene, camera);
};
const startTypewriter = () => {
    const text = props.memory.content.text || '';
    let index = 0;
    displayedText.value = '';
    const typeInterval = setInterval(() => {
        if (index < text.length) {
            displayedText.value += text[index];
            index++;
        }
        else {
            clearInterval(typeInterval);
        }
    }, 80);
};
const handleImageLoad = (e) => {
    const img = e.target;
    isPortraitImage.value = img.naturalHeight > img.naturalWidth;
    isImageLoaded.value = true;
};
function openImageExpand() {
    isImageExpanded.value = true;
    document.body.style.overflow = 'hidden';
}
function closeImageExpand() {
    isImageExpanded.value = false;
    document.body.style.overflow = '';
}
function handleExpandKeydown(e) {
    if (e.key === 'Escape' && isImageExpanded.value) {
        closeImageExpand();
    }
}
const toggleAudio = async () => {
    const url = props.memory.content.audioUrl;
    if (!url)
        return;
    if (musicPlayer.isCurrentTrack(url)) {
        await musicPlayer.toggle();
    }
    else {
        await musicPlayer.play(url, props.memory.title, mediaImages.value[0] ?? props.memory.content.imageUrl);
    }
};
const handleClose = () => {
    emit('close');
};
const handleResize = () => {
    if (!containerRef.value || !camera || !renderer)
        return;
    camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
};
watch(() => props.memory, () => {
    displayedText.value = '';
    isImageLoaded.value = false;
    isPortraitImage.value = false;
    setTimeout(() => {
        startTypewriter();
    }, 500);
}, { immediate: false });
onMounted(() => {
    initParticleBackground();
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleExpandKeydown);
    setTimeout(() => {
        startTypewriter();
    }, 800);
});
onUnmounted(() => {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('keydown', handleExpandKeydown);
    document.body.style.overflow = '';
    if (renderer) {
        renderer.dispose();
    }
    if (particlesMesh) {
        particlesMesh.geometry.dispose();
        particlesMesh.material.dispose();
    }
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
/** @type {__VLS_StyleScopedClasses['content-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['content-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['content-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['memory-title']} */ ;
/** @type {__VLS_StyleScopedClasses['image-container']} */ ;
/** @type {__VLS_StyleScopedClasses['image-container']} */ ;
/** @type {__VLS_StyleScopedClasses['is-portrait']} */ ;
/** @type {__VLS_StyleScopedClasses['image-container']} */ ;
/** @type {__VLS_StyleScopedClasses['is-portrait']} */ ;
/** @type {__VLS_StyleScopedClasses['image-container']} */ ;
/** @type {__VLS_StyleScopedClasses['is-portrait']} */ ;
/** @type {__VLS_StyleScopedClasses['image-container']} */ ;
/** @type {__VLS_StyleScopedClasses['image-container']} */ ;
/** @type {__VLS_StyleScopedClasses['media-card']} */ ;
/** @type {__VLS_StyleScopedClasses['play-button']} */ ;
/** @type {__VLS_StyleScopedClasses['back-button']} */ ;
/** @type {__VLS_StyleScopedClasses['image-container']} */ ;
/** @type {__VLS_StyleScopedClasses['image-container']} */ ;
/** @type {__VLS_StyleScopedClasses['is-clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['image-expand-hint']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ref: "containerRef",
    ...{ class: "memory-detail" },
});
/** @type {__VLS_StyleScopedClasses['memory-detail']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.canvas)({
    ref: "canvasRef",
    ...{ class: "particle-canvas" },
});
/** @type {__VLS_StyleScopedClasses['particle-canvas']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "content-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['content-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "date-badge" },
});
/** @type {__VLS_StyleScopedClasses['date-badge']} */ ;
(__VLS_ctx.memory.date);
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
    ...{ class: "memory-title" },
});
/** @type {__VLS_StyleScopedClasses['memory-title']} */ ;
(__VLS_ctx.memory.title);
if (__VLS_ctx.shouldUseSingleImageLayout) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.openImageExpand) },
        ...{ class: "image-container" },
        ...{ class: ({ 'is-portrait': __VLS_ctx.isPortraitImage, 'is-clickable': true }) },
    });
    /** @type {__VLS_StyleScopedClasses['image-container']} */ ;
    /** @type {__VLS_StyleScopedClasses['is-portrait']} */ ;
    /** @type {__VLS_StyleScopedClasses['is-clickable']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        ...{ onLoad: (__VLS_ctx.handleImageLoad) },
        src: (__VLS_ctx.mediaImages[0]),
        alt: (__VLS_ctx.memory.title),
        loading: "lazy",
        ...{ class: ({ 'is-loaded': __VLS_ctx.isImageLoaded }) },
    });
    /** @type {__VLS_StyleScopedClasses['is-loaded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "image-expand-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['image-expand-hint']} */ ;
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        icon: "tabler:zoom-in",
        ...{ class: "image-expand-hint-icon" },
    }));
    const __VLS_2 = __VLS_1({
        icon: "tabler:zoom-in",
        ...{ class: "image-expand-hint-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['image-expand-hint-icon']} */ ;
}
else if (__VLS_ctx.mediaCards.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "media-layout" },
    });
    /** @type {__VLS_StyleScopedClasses['media-layout']} */ ;
    if (__VLS_ctx.mediaCards.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "media-card photo-card" },
        });
        /** @type {__VLS_StyleScopedClasses['media-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['photo-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-head" },
        });
        /** @type {__VLS_StyleScopedClasses['card-head']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "card-title" },
        });
        /** @type {__VLS_StyleScopedClasses['card-title']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "card-meta" },
        });
        /** @type {__VLS_StyleScopedClasses['card-meta']} */ ;
        (__VLS_ctx.mediaCards.length);
        let __VLS_5;
        /** @ts-ignore @type { | typeof __VLS_components.AppleCardCarousel | typeof __VLS_components.AppleCardCarousel} */
        AppleCardCarousel;
        // @ts-ignore
        const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
            initialScroll: (0),
            itemCount: (__VLS_ctx.mediaCards.length),
            ...{ class: "photo-carousel-shell" },
        }));
        const __VLS_7 = __VLS_6({
            initialScroll: (0),
            itemCount: (__VLS_ctx.mediaCards.length),
            ...{ class: "photo-carousel-shell" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_6));
        /** @type {__VLS_StyleScopedClasses['photo-carousel-shell']} */ ;
        const { default: __VLS_10 } = __VLS_8.slots;
        for (const [card, index] of __VLS_vFor((__VLS_ctx.mediaCards))) {
            let __VLS_11;
            /** @ts-ignore @type { | typeof __VLS_components.AppleCarouselItem | typeof __VLS_components.AppleCarouselItem} */
            AppleCarouselItem;
            // @ts-ignore
            const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
                key: (`${card.src}-${index}`),
                index: (index),
                trailingSpace: (__VLS_ctx.mediaCards.length > 2),
            }));
            const __VLS_13 = __VLS_12({
                key: (`${card.src}-${index}`),
                index: (index),
                trailingSpace: (__VLS_ctx.mediaCards.length > 2),
            }, ...__VLS_functionalComponentArgsRest(__VLS_12));
            const { default: __VLS_16 } = __VLS_14.slots;
            let __VLS_17;
            /** @ts-ignore @type { | typeof __VLS_components.AppleCard | typeof __VLS_components.AppleCard} */
            AppleCard;
            // @ts-ignore
            const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
                card: (card),
                index: (index),
                layout: (true),
                hidePreviewText: (true),
            }));
            const __VLS_19 = __VLS_18({
                card: (card),
                index: (index),
                layout: (true),
                hidePreviewText: (true),
            }, ...__VLS_functionalComponentArgsRest(__VLS_18));
            const { default: __VLS_22 } = __VLS_20.slots;
            if (card.mediaType === 'image') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                    src: (card.src),
                    alt: (card.title),
                    ...{ class: "photo-expanded-image" },
                    loading: "lazy",
                });
                /** @type {__VLS_StyleScopedClasses['photo-expanded-image']} */ ;
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.video)({
                    ...{ class: "media-expanded-video" },
                    src: (card.mediaUrl),
                    poster: (card.src),
                    controls: true,
                    playsinline: true,
                    preload: "metadata",
                });
                /** @type {__VLS_StyleScopedClasses['media-expanded-video']} */ ;
            }
            // @ts-ignore
            [memory, memory, memory, shouldUseSingleImageLayout, openImageExpand, isPortraitImage, handleImageLoad, mediaImages, isImageLoaded, mediaCards, mediaCards, mediaCards, mediaCards, mediaCards, mediaCards,];
            var __VLS_20;
            // @ts-ignore
            [];
            var __VLS_14;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_8;
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "memory-text" },
});
/** @type {__VLS_StyleScopedClasses['memory-text']} */ ;
(__VLS_ctx.displayedText);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "cursor" },
});
/** @type {__VLS_StyleScopedClasses['cursor']} */ ;
if (__VLS_ctx.memory.content.location) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "location-tag" },
    });
    /** @type {__VLS_StyleScopedClasses['location-tag']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "location-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['location-icon']} */ ;
    (__VLS_ctx.memory.content.location);
}
if (__VLS_ctx.memory.content.audioUrl) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "audio-controls" },
    });
    /** @type {__VLS_StyleScopedClasses['audio-controls']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleAudio) },
        ...{ class: "play-button" },
    });
    /** @type {__VLS_StyleScopedClasses['play-button']} */ ;
    if (__VLS_ctx.isCurrentPlaying) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    (__VLS_ctx.isCurrentPlaying ? '暂停' : '播放');
}
const __VLS_23 = CommentSection;
// @ts-ignore
const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
    memoryId: (__VLS_ctx.memory.id),
}));
const __VLS_25 = __VLS_24({
    memoryId: (__VLS_ctx.memory.id),
}, ...__VLS_functionalComponentArgsRest(__VLS_24));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.handleClose) },
    ...{ class: "back-button" },
});
/** @type {__VLS_StyleScopedClasses['back-button']} */ ;
let __VLS_28;
/** @ts-ignore @type { | typeof __VLS_components.Teleport | typeof __VLS_components.Teleport} */
Teleport;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
    to: "body",
}));
const __VLS_30 = __VLS_29({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
const { default: __VLS_33 } = __VLS_31.slots;
let __VLS_34;
/** @ts-ignore @type { | typeof __VLS_components.AnimatePresence | typeof __VLS_components.AnimatePresence} */
AnimatePresence;
// @ts-ignore
const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({}));
const __VLS_36 = __VLS_35({}, ...__VLS_functionalComponentArgsRest(__VLS_35));
const { default: __VLS_39 } = __VLS_37.slots;
if (__VLS_ctx.isImageExpanded) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeImageExpand) },
        ...{ class: "fixed inset-0 z-[9999] overflow-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-[9999]']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
    let __VLS_40;
    /** @ts-ignore @type { | typeof __VLS_components.Motion} */
    Motion;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        initial: ({ opacity: 0 }),
        animate: ({ opacity: 1 }),
        exit: ({ opacity: 0 }),
        transition: ({ duration: 0.2 }),
        ...{ class: "fixed inset-0 size-full bg-black/80 backdrop-blur-xl" },
    }));
    const __VLS_42 = __VLS_41({
        initial: ({ opacity: 0 }),
        animate: ({ opacity: 1 }),
        exit: ({ opacity: 0 }),
        transition: ({ duration: 0.2 }),
        ...{ class: "fixed inset-0 size-full bg-black/80 backdrop-blur-xl" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-black/80']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur-xl']} */ ;
    let __VLS_45;
    /** @ts-ignore @type { | typeof __VLS_components.Motion | typeof __VLS_components.Motion} */
    Motion;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
        ...{ 'onClick': {} },
        initial: ({ opacity: 0, scale: 0.95 }),
        animate: ({ opacity: 1, scale: 1 }),
        exit: ({ opacity: 0, scale: 0.95 }),
        transition: ({ duration: 0.25, ease: 'easeOut' }),
        ...{ class: "relative z-60 mx-auto my-10 h-fit max-w-5xl rounded-3xl bg-white p-4 md:p-10 dark:bg-neutral-900" },
    }));
    const __VLS_47 = __VLS_46({
        ...{ 'onClick': {} },
        initial: ({ opacity: 0, scale: 0.95 }),
        animate: ({ opacity: 1, scale: 1 }),
        exit: ({ opacity: 0, scale: 0.95 }),
        transition: ({ duration: 0.25, ease: 'easeOut' }),
        ...{ class: "relative z-60 mx-auto my-10 h-fit max-w-5xl rounded-3xl bg-white p-4 md:p-10 dark:bg-neutral-900" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    let __VLS_50;
    const __VLS_51 = {
        ...{ click: {} },
        onClick: () => { },
    };
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-60']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['my-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-fit']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-5xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:p-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-neutral-900']} */ ;
    const { default: __VLS_52 } = __VLS_48.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeImageExpand) },
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
    let __VLS_53;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({
        icon: "tabler:x",
        ...{ class: "size-6 text-neutral-100 dark:text-neutral-900" },
    }));
    const __VLS_55 = __VLS_54({
        icon: "tabler:x",
        ...{ class: "size-6 text-neutral-100 dark:text-neutral-900" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_54));
    /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-neutral-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-neutral-900']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-base font-medium text-black dark:text-white" },
    });
    /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-black']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-white']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 text-2xl font-semibold text-neutral-700 md:text-5xl dark:text-white" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-neutral-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:text-5xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-white']} */ ;
    (__VLS_ctx.memory.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-10" },
    });
    /** @type {__VLS_StyleScopedClasses['py-10']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_ctx.mediaImages[0]),
        alt: (__VLS_ctx.memory.title),
        ...{ class: "block w-full max-h-[78vh] object-contain rounded-xl" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-h-[78vh]']} */ ;
    /** @type {__VLS_StyleScopedClasses['object-contain']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
    // @ts-ignore
    [memory, memory, memory, memory, memory, memory, mediaImages, displayedText, toggleAudio, isCurrentPlaying, isCurrentPlaying, handleClose, isImageExpanded, closeImageExpand, closeImageExpand,];
    var __VLS_48;
    var __VLS_49;
}
// @ts-ignore
[];
var __VLS_37;
// @ts-ignore
[];
var __VLS_31;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
