<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import * as THREE from 'three'
import type { Memory } from '@/types/memory'
import { useMusicPlayerStore } from '@/stores/musicPlayer'

const props = defineProps<{
  memory: Memory
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const displayedText = ref('')
const isImageLoaded = ref(false)

const musicPlayer = useMusicPlayerStore()

const isCurrentPlaying = computed(
  () =>
    !!props.memory.content.audioUrl &&
    musicPlayer.isCurrentTrack(props.memory.content.audioUrl) &&
    musicPlayer.isPlaying
)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animationId: number
let particlesMesh: THREE.Points
let particlePositions: Float32Array
let particleOriginalPositions: Float32Array

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
  const text = props.memory.content.text || ''
  let index = 0
  displayedText.value = ''

  const typeInterval = setInterval(() => {
    if (index < text.length) {
      displayedText.value += text[index]
      index++
    } else {
      clearInterval(typeInterval)
    }
  }, 80)
}

const handleImageLoad = () => {
  isImageLoaded.value = true
}

const toggleAudio = async () => {
  const url = props.memory.content.audioUrl
  if (!url) return

  if (musicPlayer.isCurrentTrack(url)) {
    await musicPlayer.toggle()
  } else {
    await musicPlayer.play(url, props.memory.title, props.memory.content.imageUrl)
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

watch(() => props.memory, () => {
  displayedText.value = ''
  isImageLoaded.value = false

  setTimeout(() => {
    startTypewriter()
  }, 500)
}, { immediate: false })

onMounted(() => {
  initParticleBackground()
  window.addEventListener('resize', handleResize)

  setTimeout(() => {
    startTypewriter()
  }, 800)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)

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

    <div class="content-wrapper">
      <div class="date-badge">
        {{ memory.date }}
      </div>

      <h2 class="memory-title">
        {{ memory.title }}
      </h2>

      <div v-if="memory.content.imageUrl" class="image-container">
        <img
          :src="memory.content.imageUrl"
          :alt="memory.title"
          loading="lazy"
          :class="{ 'is-loaded': isImageLoaded }"
          @load="handleImageLoad"
        />
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

      <button class="back-button" @click="handleClose">
        ← 返回星球
      </button>
    </div>
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
  max-width: 600px;
  width: 90%;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  text-align: center;
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
  width: 100%;
  max-width: 400px;
  aspect-ratio: 4/3;
  border-radius: 1rem;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.image-container img.is-loaded {
  opacity: 1;
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
</style>
