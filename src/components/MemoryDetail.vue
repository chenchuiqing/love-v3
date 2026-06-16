<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import * as THREE from 'three'
import type { Memory, ParticleTheme } from '@/types/memory'
import { useMusicPlayerStore } from '@/stores/musicPlayer'
import { AnimatePresence, Motion } from 'motion-v'
import { Icon } from '@iconify/vue'
import { AppleCard, AppleCardCarousel, AppleCarouselItem } from '@/components/ui/apple-card-carousel'
import CommentSection from '@/components/CommentSection.vue'

const props = defineProps<{
  memory: Memory
  scrollToCommentId?: string | null
  showThemeSelector?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:theme', theme: ParticleTheme): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const commentSectionRef = ref<InstanceType<typeof CommentSection> | null>(null)

const displayedText = ref('')
const isImageLoaded = ref(false)
const isPortraitImage = ref(false)
const isImageExpanded = ref(false)

const musicPlayer = useMusicPlayerStore()

const isCurrentPlaying = computed(
  () =>
    !!props.memory.content.audioUrl &&
    musicPlayer.isCurrentTrack(props.memory.content.audioUrl) &&
    musicPlayer.isPlaying
)

const mediaImages = computed(() => {
  const urls = props.memory.content.imageUrls
  if (Array.isArray(urls) && urls.length > 0) {
    return urls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0).slice(0, 5)
  }

  if (props.memory.content.imageUrl) {
    return [props.memory.content.imageUrl]
  }

  return []
})

type MediaCardItem = {
  src: string
  title: string
  category: string
  mediaType: 'image' | 'video'
  mediaUrl: string
}

const mediaCards = computed<MediaCardItem[]>(() => {
  const photoItems = mediaImages.value.map((src, index) => ({
    src,
    title: `${props.memory.title} #${index + 1}`,
    category: '回忆照片',
    mediaType: 'image' as const,
    mediaUrl: src,
  }))

  const cards: MediaCardItem[] = [...photoItems]

  if (props.memory.content.videoUrl) {
    cards.push({
      src: props.memory.content.videoUrl,
      title: `${props.memory.title} · 视频`,
      category: '回忆视频',
      mediaType: 'video',
      mediaUrl: props.memory.content.videoUrl,
    })
  }

  return cards
})

const shouldUseSingleImageLayout = computed(() => mediaImages.value.length === 1 && !props.memory.content.videoUrl)

const particleThemeOptions: { value: ParticleTheme; label: string }[] = [
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
]

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animationId: number
let particlesMesh: THREE.Points
let particlePositions: Float32Array
let particleOriginalPositions: Float32Array
let typewriterInterval: ReturnType<typeof setInterval> | null = null

const PARTICLE_COUNT = 8000

const themeColors = computed(() => {
  switch (props.memory.content.theme) {
    case 'ocean':
      return { primary: '#0a4a8e', secondary: '#1a6fb8', accent: '#4a90d9' }
    case 'forest':
      return { primary: '#0a4a2e', secondary: '#1a6b48', accent: '#2ecc71' }
    case 'city':
      return { primary: '#2a1a4a', secondary: '#4a2a7a', accent: '#9b59b6' }
    case 'sky':
      return { primary: '#1e6a9e', secondary: '#4a9fd4', accent: '#9ed4f5' }
    case 'summit':
      return { primary: '#1a5268', secondary: '#2d7a8c', accent: '#7ec8b8' }
    case 'sunshine':
      return { primary: '#4a5020', secondary: '#7a8040', accent: '#f0d060' }
    case 'meadow':
      return { primary: '#2a6040', secondary: '#4a9060', accent: '#b8e8a0' }
    case 'night':
      return { primary: '#05070a', secondary: '#141a22', accent: '#5a6578' }
    case 'fireworks':
      return { primary: '#07050a', secondary: '#2a1420', accent: '#e8944a' }
    case 'moonlight':
      return { primary: '#030508', secondary: '#0c1420', accent: '#a8bcd8' }
    case 'neon':
      return { primary: '#05030a', secondary: '#1a0f2e', accent: '#67e8d0' }
    default:
      return { primary: '#0a1a3a', secondary: '#1a3a6a', accent: '#4a6a9a' }
  }
})

const createParticleTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')!

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.3, 'rgba(200, 220, 255, 0.6)')
  gradient.addColorStop(0.6, 'rgba(100, 150, 255, 0.2)')
  gradient.addColorStop(1, 'transparent')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)

  return new THREE.CanvasTexture(canvas)
}

const updateParticleColors = () => {
  if (!scene || !particlesMesh) return

  const colors = themeColors.value
  scene.background = new THREE.Color(colors.primary)

  const accentColor = new THREE.Color(colors.accent)
  const secondaryColor = new THREE.Color(colors.secondary)
  const colorAttr = particlesMesh.geometry.attributes.color as THREE.BufferAttribute

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const mixRatio = Math.random()
    const mixedColor = accentColor.clone().lerp(secondaryColor, mixRatio)
    colorAttr.array[i * 3] = mixedColor.r
    colorAttr.array[i * 3 + 1] = mixedColor.g
    colorAttr.array[i * 3 + 2] = mixedColor.b
  }
  colorAttr.needsUpdate = true
}

const handleThemeChange = (event: Event) => {
  const select = event.target as HTMLSelectElement
  const newTheme = select.value as ParticleTheme
  emit('update:theme', newTheme)
}

const initParticleBackground = () => {
  if (!canvasRef.value || !containerRef.value) return

  scene = new THREE.Scene()
  const color = new THREE.Color(themeColors.value.primary)
  scene.background = color

  camera = new THREE.PerspectiveCamera(
    60,
    containerRef.value.clientWidth / containerRef.value.clientHeight,
    0.1,
    100
  )
  camera.position.z = 5

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true
  })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const geometry = new THREE.BufferGeometry()
  particlePositions = new Float32Array(PARTICLE_COUNT * 3)
  particleOriginalPositions = new Float32Array(PARTICLE_COUNT * 3)
  const colors = new Float32Array(PARTICLE_COUNT * 3)

  const accentColor = new THREE.Color(themeColors.value.accent)
  const secondaryColor = new THREE.Color(themeColors.value.secondary)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (Math.random() - 0.5) * 20
    const y = (Math.random() - 0.5) * 12
    const z = (Math.random() - 0.5) * 5

    particlePositions[i * 3] = x
    particlePositions[i * 3 + 1] = y
    particlePositions[i * 3 + 2] = z
    particleOriginalPositions[i * 3] = x
    particleOriginalPositions[i * 3 + 1] = y
    particleOriginalPositions[i * 3 + 2] = z

    const mixRatio = Math.random()
    const mixedColor = accentColor.clone().lerp(secondaryColor, mixRatio)
    colors[i * 3] = mixedColor.r
    colors[i * 3 + 1] = mixedColor.g
    colors[i * 3 + 2] = mixedColor.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const texture = createParticleTexture()
  const material = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    map: texture,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  particlesMesh = new THREE.Points(geometry, material)
  scene.add(particlesMesh)

  animateParticles()
}

const animateParticles = () => {
  animationId = requestAnimationFrame(animateParticles)

  const time = Date.now() * 0.001
  const positions = particlesMesh.geometry.attributes.position.array as Float32Array

  if (props.memory.content.theme === 'ocean') {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const originalY = particleOriginalPositions[i * 3 + 1]
      const x = particleOriginalPositions[i * 3]
      positions[i * 3 + 1] = originalY + Math.sin(time * 0.8 + x * 0.5) * 0.3
    }
  } else {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const originalX = particleOriginalPositions[i * 3]
      const originalY = particleOriginalPositions[i * 3 + 1]
      positions[i * 3] = originalX + Math.sin(time * 0.3 + i * 0.01) * 0.1
      positions[i * 3 + 1] = originalY + Math.cos(time * 0.2 + i * 0.01) * 0.05
    }
  }

  particlesMesh.geometry.attributes.position.needsUpdate = true
  particlesMesh.rotation.z = Math.sin(time * 0.1) * 0.02

  renderer.render(scene, camera)
}

const startTypewriter = () => {
  if (typewriterInterval) clearInterval(typewriterInterval)
  const text = props.memory.content.text || ''
  let index = 0
  displayedText.value = ''

  typewriterInterval = setInterval(() => {
    if (index < text.length) {
      displayedText.value += text[index]
      index++
    } else {
      if (typewriterInterval) {
        clearInterval(typewriterInterval)
        typewriterInterval = null
      }
    }
  }, 80)
}

const handleImageLoad = (e: Event) => {
  const img = e.target as HTMLImageElement
  isPortraitImage.value = img.naturalHeight > img.naturalWidth
  isImageLoaded.value = true
}

function openImageExpand() {
  isImageExpanded.value = true
  document.body.style.overflow = 'hidden'
}

function closeImageExpand() {
  isImageExpanded.value = false
  document.body.style.overflow = ''
}

function handleExpandKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isImageExpanded.value) {
    closeImageExpand()
  }
}

const toggleAudio = async () => {
  const url = props.memory.content.audioUrl
  if (!url) return

  if (musicPlayer.isCurrentTrack(url)) {
    await musicPlayer.toggle()
  } else {
    await musicPlayer.play(url, props.memory.title, mediaImages.value[0] ?? props.memory.content.imageUrl)
  }
}

const handleClose = () => {
  emit('close')
}

const handleResize = () => {
  if (!containerRef.value || !camera || !renderer) return

  camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}

const scrollToComment = (commentId: string) => {
  // 如果评论区折叠了，先展开
  if (commentSectionRef.value?.isCollapsed) {
    commentSectionRef.value.expand()
  }

  // 等待评论加载完成后滚动，支持轮询等待 DOM 挂载
  let attempts = 0
  const MAX_ATTEMPTS = 10
  const tryScroll = () => {
    const commentElement = document.getElementById(`comment-${commentId}`)
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      commentElement.classList.add('comment-highlight')
      setTimeout(() => {
        commentElement.classList.remove('comment-highlight')
      }, 3000)
    } else if (attempts < MAX_ATTEMPTS) {
      attempts++
      setTimeout(tryScroll, 200)
    }
  }
  setTimeout(tryScroll, 200)
}

// 监听 scrollToCommentId 变化，处理同一记忆点内切换评论的场景
watch(() => props.scrollToCommentId, (newCommentId) => {
  if (newCommentId) {
    scrollToComment(newCommentId)
  }
})

watch(() => props.memory, (newMem, oldMem) => {
  // Skip restarting typewriter if only the theme changed
  if (oldMem && newMem.id === oldMem.id && newMem.content.text === oldMem.content.text) {
    return
  }
  displayedText.value = ''
  isImageLoaded.value = false
  isPortraitImage.value = false

  setTimeout(() => {
    startTypewriter()
  }, 500)
}, { immediate: false })

// Watch for theme changes from parent and update particle colors in real-time
watch(() => props.memory.content.theme, (newTheme) => {
  if (newTheme && scene) {
    updateParticleColors()
  }
})

onMounted(() => {
  initParticleBackground()
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleExpandKeydown)

  setTimeout(() => {
    startTypewriter()

    if (props.scrollToCommentId) {
      scrollToComment(props.scrollToCommentId)
    }
  }, 800)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  if (typewriterInterval) clearInterval(typewriterInterval)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleExpandKeydown)
  document.body.style.overflow = ''

  if (renderer) {
    renderer.dispose()
  }
  if (particlesMesh) {
    particlesMesh.geometry.dispose()
    ;(particlesMesh.material as THREE.PointsMaterial).dispose()
  }
})
</script>

<template>
  <div ref="containerRef" class="memory-detail">
    <canvas ref="canvasRef" class="particle-canvas" />

    <!-- Theme selector (only shown in admin preview mode) -->
    <div v-if="showThemeSelector" class="absolute top-4 right-4 z-20 flex items-center gap-2.5 rounded-xl border border-white/20 bg-[#0c1423]/75 backdrop-blur-xl px-4 py-2.5">
      <span class="text-xs font-medium text-white/75 whitespace-nowrap">粒子主题</span>
      <select
        :value="memory.content.theme"
        class="theme-preview-select appearance-none rounded-md border border-white/25 bg-white/10 pl-2 pr-6 py-1 text-xs text-white/90 cursor-pointer hover:border-white/45 hover:bg-white/15 focus:outline-none focus:border-white/55 focus:ring-2 focus:ring-white/10 transition-colors"
        @change="handleThemeChange"
      >
        <option
          v-for="opt in particleThemeOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div class="content-wrapper">
      <div class="date-badge">
        {{ memory.date }}
      </div>

      <h2 class="memory-title">
        {{ memory.title }}
      </h2>

      <div
        v-if="shouldUseSingleImageLayout"
        class="image-container"
        :class="{ 'is-portrait': isPortraitImage, 'is-clickable': true }"
        @click="openImageExpand"
      >
        <img
          :src="mediaImages[0]"
          :alt="memory.title"
          loading="lazy"
          :class="{ 'is-loaded': isImageLoaded }"
          @load="handleImageLoad"
        />
        <div class="image-expand-hint">
          <Icon icon="tabler:zoom-in" class="image-expand-hint-icon" />
        </div>
      </div>

      <div
        v-else-if="mediaCards.length > 0"
        class="media-layout"
      >
        <section v-if="mediaCards.length > 0" class="media-card photo-card">
          <div class="card-head">
            <span class="card-title">媒体集</span>
            <span class="card-meta">{{ mediaCards.length }} 张/段</span>
          </div>

          <AppleCardCarousel
            :initial-scroll="0"
            :item-count="mediaCards.length"
            class="photo-carousel-shell"
          >
            <AppleCarouselItem
              v-for="(card, index) in mediaCards"
              :key="`${card.src}-${index}`"
              :index="index"
              :trailing-space="mediaCards.length > 2"
            >
              <AppleCard
                :card="card"
                :index="index"
                :layout="true"
                :hide-preview-text="true"
              >
                <img
                  v-if="card.mediaType === 'image'"
                  :src="card.src"
                  :alt="card.title"
                  class="photo-expanded-image"
                  loading="lazy"
                />
                <video
                  v-else
                  class="media-expanded-video"
                  :src="card.mediaUrl"
                  :poster="card.src"
                  controls
                  playsinline
                  preload="metadata"
                />
              </AppleCard>
            </AppleCarouselItem>
          </AppleCardCarousel>
        </section>
      </div>

      <p class="memory-text">
        {{ displayedText }}<span class="cursor">|</span>
      </p>

      <div v-if="memory.content.location" class="location-tag">
        <span class="location-icon">📍</span>
        {{ memory.content.location }}
      </div>

      <div v-if="memory.content.audioUrl" class="audio-controls">
        <button
          class="play-button"
          @click="toggleAudio"
        >
          <span v-if="isCurrentPlaying">⏸</span>
          <span v-else>▶</span>
          {{ isCurrentPlaying ? '暂停' : '播放' }}
        </button>
      </div>

      <CommentSection ref="commentSectionRef" :memory-id="memory.id" />

      <button class="back-button" @click="handleClose">
        ← 返回星球
      </button>
    </div>

    <Teleport to="body">
      <AnimatePresence>
        <div v-if="isImageExpanded" class="fixed inset-0 z-[9999] overflow-auto" @click="closeImageExpand">
          <Motion
            :initial="{ opacity: 0 }"
            :animate="{ opacity: 1 }"
            :exit="{ opacity: 0 }"
            :transition="{ duration: 0.2 }"
            class="fixed inset-0 size-full bg-black/80 backdrop-blur-xl"
          />
          <Motion
            :initial="{ opacity: 0, scale: 0.95 }"
            :animate="{ opacity: 1, scale: 1 }"
            :exit="{ opacity: 0, scale: 0.95 }"
            :transition="{ duration: 0.25, ease: 'easeOut' }"
            class="relative z-60 mx-auto my-10 h-fit max-w-5xl rounded-3xl bg-white p-4 md:p-10 dark:bg-neutral-900"
            @click.stop
          >
            <button class="sticky top-4 right-0 ml-auto flex size-8 items-center justify-center rounded-full bg-black dark:bg-white" @click="closeImageExpand">
              <Icon icon="tabler:x" class="size-6 text-neutral-100 dark:text-neutral-900" />
            </button>
            <div class="text-base font-medium text-black dark:text-white">回忆照片</div>
            <div class="mt-4 text-2xl font-semibold text-neutral-700 md:text-5xl dark:text-white">{{ memory.title }}</div>
            <div class="py-10">
              <img
                :src="mediaImages[0]"
                :alt="memory.title"
                class="block w-full max-h-[78vh] object-contain rounded-xl"
              />
            </div>
          </Motion>
        </div>
      </AnimatePresence>
    </Teleport>
  </div>
</template>

<style scoped>
.memory-detail {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.particle-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.content-wrapper {
  position: relative;
  z-index: 10;
  max-width: 760px;
  width: 90%;
  max-height: 100dvh;
  box-sizing: border-box;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  text-align: center;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.content-wrapper::-webkit-scrollbar {
  display: none;
}

.content-wrapper > * {
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .content-wrapper {
    width: 100%;
    padding: 1.25rem 1rem 1.5rem;
    gap: 1rem;
  }

  .memory-title {
    font-size: 1.5rem;
  }

  .media-card {
    padding: 0.65rem;
  }
}

.date-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  backdrop-filter: blur(10px);
}

.memory-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: white;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.image-container {
  position: relative;
  max-width: 400px;
  margin: 0 auto;
}

.image-container.is-portrait {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  line-height: 0;
}

.image-container.is-portrait img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.image-container:not(.is-portrait) {
  display: block;
  width: 100%;
  line-height: 0;
}

.image-container:not(.is-portrait) img {
  display: block;
  width: 100%;
  height: auto;
  max-height: min(42vh, 320px);
  object-fit: contain;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.image-container img {
  opacity: 0;
  transition: opacity 0.5s ease;
}

.image-container img.is-loaded {
  opacity: 1;
}

.media-layout {
  width: 100%;
  display: grid;
  gap: 0.85rem;
  max-width: 700px;
}

.media-card {
  padding: 0.8rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(12, 20, 35, 0.5);
  backdrop-filter: blur(10px);
}

.photo-card {
  width: min(100%, 36rem);
  justify-self: center;
  overflow: hidden;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.65rem;
}

.card-title {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.92);
}

.card-meta {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.7);
}

.photo-carousel-shell {
  margin-top: -0.35rem;
  margin-bottom: -0.25rem;
}

.photo-expanded-image {
  display: block;
  width: 100%;
  max-height: min(78vh, 760px);
  object-fit: contain;
  border-radius: 1rem;
}

.media-expanded-video {
  display: block;
  width: 100%;
  max-height: min(78vh, 760px);
  border-radius: 1rem;
  background: #020617;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.memory-text {
  font-size: 1.125rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  white-space: pre-line;
  min-height: 3.6em;
}

.cursor {
  animation: blink 1s infinite;
  color: rgba(255, 255, 255, 0.7);
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.location-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}

.location-icon {
  font-size: 1rem;
}

.audio-controls {
  margin-top: 0.5rem;
}

.play-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 2rem;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.play-button:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.back-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
}

.image-container.is-clickable {
  cursor: pointer;
}

.image-expand-hint {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.image-container.is-clickable:hover .image-expand-hint {
  opacity: 1;
}

.image-expand-hint-icon {
  width: 1.1rem;
  height: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
}

/* Theme preview select — custom arrow & option colors Tailwind cannot express */
.theme-preview-select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.7)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.35rem center;
}

.theme-preview-select option {
  background: #1a2035;
  color: rgba(255, 255, 255, 0.9);
}
</style>
