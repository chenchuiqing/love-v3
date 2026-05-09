<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import gsap from 'gsap'

const emit = defineEmits<{
  (e: 'act1Complete'): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const drawingCanvasRef = ref<HTMLCanvasElement | null>(null)
const hasInteracted = ref(false)
const isCollapsing = ref(false)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animationId = 0
let particles: THREE.Points
let particleGeometry: THREE.BufferGeometry
let particleMaterial: THREE.PointsMaterial
let particlePositions: Float32Array
let basePositions: Float32Array

const PARTICLE_COUNT = 15000
const pathPoints: THREE.Vector2[] = []
const highlightedIndices = new Set<number>()

const pointerState = {
  isDrawing: false
}

const createParticleTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.22, 'rgba(219, 232, 255, 0.92)')
  gradient.addColorStop(0.58, 'rgba(136, 182, 255, 0.34)')
  gradient.addColorStop(1, 'transparent')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)
  return new THREE.CanvasTexture(canvas)
}

const initScene = () => {
  if (!containerRef.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000010)

  camera = new THREE.PerspectiveCamera(
    56,
    containerRef.value.clientWidth / containerRef.value.clientHeight,
    0.1,
    100
  )
  camera.position.set(0, 0, 4)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.appendChild(renderer.domElement)

  particleGeometry = new THREE.BufferGeometry()
  particlePositions = new Float32Array(PARTICLE_COUNT * 3)
  basePositions = new Float32Array(PARTICLE_COUNT * 3)
  const colors = new Float32Array(PARTICLE_COUNT * 3)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (Math.random() - 0.5) * 12
    const y = (Math.random() - 0.5) * 7
    const z = (Math.random() - 0.5) * 0.25

    particlePositions[i * 3] = x
    particlePositions[i * 3 + 1] = y
    particlePositions[i * 3 + 2] = z
    basePositions[i * 3] = x
    basePositions[i * 3 + 1] = y
    basePositions[i * 3 + 2] = z

    colors[i * 3] = 0.88 + Math.random() * 0.12
    colors[i * 3 + 1] = 0.9 + Math.random() * 0.1
    colors[i * 3 + 2] = 1
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  particleMaterial = new THREE.PointsMaterial({
    size: 0.035,
    vertexColors: true,
    transparent: true,
    opacity: 0.86,
    map: createParticleTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  particles = new THREE.Points(particleGeometry, particleMaterial)
  scene.add(particles)
}

const animate = () => {
  animationId = requestAnimationFrame(animate)
  particles.rotation.z += 0.0005
  renderer.render(scene, camera)
}

const resizeDrawingCanvas = () => {
  if (!containerRef.value || !drawingCanvasRef.value) return
  drawingCanvasRef.value.width = containerRef.value.clientWidth
  drawingCanvasRef.value.height = containerRef.value.clientHeight
}

const drawTrailSegment = (from: PointerEvent, to: PointerEvent) => {
  const canvas = drawingCanvasRef.value
  if (!canvas || !containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.strokeStyle = 'rgba(255, 211, 236, 0.9)'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowBlur = 12
  ctx.shadowColor = 'rgba(255, 108, 176, 0.7)'
  ctx.beginPath()
  ctx.moveTo(from.clientX - rect.left, from.clientY - rect.top)
  ctx.lineTo(to.clientX - rect.left, to.clientY - rect.top)
  ctx.stroke()
}

const screenToWorld = (clientX: number, clientY: number): THREE.Vector3 => {
  const rect = containerRef.value!.getBoundingClientRect()
  const ndc = new THREE.Vector3(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
    0
  )

  ndc.unproject(camera)
  const direction = ndc.sub(camera.position).normalize()
  const distance = -camera.position.z / direction.z
  return camera.position.clone().add(direction.multiplyScalar(distance))
}

const attractParticlesToPoint = (worldPoint: THREE.Vector3) => {
  const candidateCount = 20
  const candidates: { index: number; dist: number }[] = []

  for (let i = 0; i < PARTICLE_COUNT; i += 6) {
    const px = particlePositions[i * 3]
    const py = particlePositions[i * 3 + 1]
    const dx = px - worldPoint.x
    const dy = py - worldPoint.y
    const dist = dx * dx + dy * dy

    if (candidates.length < candidateCount) {
      candidates.push({ index: i, dist })
      continue
    }

    let maxIdx = 0
    for (let j = 1; j < candidates.length; j++) {
      if (candidates[j].dist > candidates[maxIdx].dist) {
        maxIdx = j
      }
    }
    if (dist < candidates[maxIdx].dist) {
      candidates[maxIdx] = { index: i, dist }
    }
  }

  for (const candidate of candidates) {
    const i = candidate.index
    highlightedIndices.add(i)
    particlePositions[i * 3] += (worldPoint.x - particlePositions[i * 3]) * 0.22
    particlePositions[i * 3 + 1] += (worldPoint.y - particlePositions[i * 3 + 1]) * 0.22
    particlePositions[i * 3 + 2] += (0 - particlePositions[i * 3 + 2]) * 0.16
  }

  particleGeometry.attributes.position.needsUpdate = true
}

const animateHeartCollapse = () => {
  if (isCollapsing.value || highlightedIndices.size === 0) return
  isCollapsing.value = true

  const indices = Array.from(highlightedIndices)
  const start = new Float32Array(indices.length * 3)
  let cx = 0
  let cy = 0
  let cz = 0

  indices.forEach((idx, index) => {
    const x = particlePositions[idx * 3]
    const y = particlePositions[idx * 3 + 1]
    const z = particlePositions[idx * 3 + 2]
    start[index * 3] = x
    start[index * 3 + 1] = y
    start[index * 3 + 2] = z
    cx += x
    cy += y
    cz += z
  })

  cx /= indices.length
  cy /= indices.length
  cz /= indices.length

  const progress = { value: 0 }
  gsap.to(progress, {
    value: 1,
    duration: 2,
    ease: 'power3.in',
    onUpdate: () => {
      const p = progress.value
      indices.forEach((idx, index) => {
        particlePositions[idx * 3] = THREE.MathUtils.lerp(start[index * 3], cx, p)
        particlePositions[idx * 3 + 1] = THREE.MathUtils.lerp(start[index * 3 + 1], cy, p)
        particlePositions[idx * 3 + 2] = THREE.MathUtils.lerp(start[index * 3 + 2], cz, p)
      })
      particleGeometry.attributes.position.needsUpdate = true
      particleMaterial.opacity = 0.86 + p * 0.14
    },
    onComplete: () => {
      emit('act1Complete')
    }
  })
}

const clearDrawingCanvas = () => {
  const canvas = drawingCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

const resetDrawing = () => {
  if (isCollapsing.value) return
  pathPoints.length = 0
  highlightedIndices.clear()
  hasInteracted.value = false
  clearDrawingCanvas()

  const progress = { value: 0 }
  const startPositions = new Float32Array(particlePositions)
  gsap.to(progress, {
    value: 1,
    duration: 0.9,
    ease: 'power2.out',
    onUpdate: () => {
      const p = progress.value
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlePositions[i * 3] = THREE.MathUtils.lerp(startPositions[i * 3], basePositions[i * 3], p)
        particlePositions[i * 3 + 1] = THREE.MathUtils.lerp(startPositions[i * 3 + 1], basePositions[i * 3 + 1], p)
        particlePositions[i * 3 + 2] = THREE.MathUtils.lerp(startPositions[i * 3 + 2], basePositions[i * 3 + 2], p)
      }
      particleGeometry.attributes.position.needsUpdate = true
    }
  })
}

const handlePointerDown = (event: PointerEvent) => {
  if (isCollapsing.value) return
  pointerState.isDrawing = true
  hasInteracted.value = true
  const world = screenToWorld(event.clientX, event.clientY)
  pathPoints.push(new THREE.Vector2(world.x, world.y))
  attractParticlesToPoint(world)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!pointerState.isDrawing || isCollapsing.value) return
  const previousEvent = (handlePointerMove as unknown as { prev?: PointerEvent }).prev
  if (previousEvent) {
    drawTrailSegment(previousEvent, event)
  }
  ;(handlePointerMove as unknown as { prev?: PointerEvent }).prev = event

  const world = screenToWorld(event.clientX, event.clientY)
  pathPoints.push(new THREE.Vector2(world.x, world.y))
  attractParticlesToPoint(world)
}

const handlePointerUp = () => {
  if (!pointerState.isDrawing) return
  pointerState.isDrawing = false
  ;(handlePointerMove as unknown as { prev?: PointerEvent }).prev = undefined

  if (pathPoints.length >= 20) {
    animateHeartCollapse()
  }
}

const handleResize = () => {
  if (!containerRef.value) return
  camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  resizeDrawingCanvas()
}

onMounted(() => {
  initScene()
  resizeDrawingCanvas()
  animate()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)

  if (renderer) {
    renderer.dispose()
  }
  if (particleGeometry) {
    particleGeometry.dispose()
  }
  if (particleMaterial) {
    particleMaterial.dispose()
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="phase-three"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointerleave="handlePointerUp"
  >
    <canvas ref="drawingCanvasRef" class="drawing-layer" />

    <Transition
      enter-active-class="transition-opacity duration-500"
      leave-active-class="transition-opacity duration-500"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <p v-if="!hasInteracted" class="draw-hint">用你的指尖，画出心中的形状</p>
    </Transition>

    <button class="reset-btn" @click="resetDrawing">重新画</button>
  </div>
</template>

<style scoped>
.phase-three {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000010;
}

.drawing-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.draw-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  margin: 0;
  transform: translate(-50%, -50%);
  padding: 0.52rem 1.1rem;
  border-radius: 999px;
  border: 1px solid rgba(195, 212, 255, 0.4);
  background: rgba(8, 18, 44, 0.5);
  color: rgba(236, 241, 255, 0.96);
  font-size: 0.84rem;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.reset-btn {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  z-index: 5;
  padding: 0.45rem 0.95rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 186, 222, 0.45);
  background: rgba(30, 8, 33, 0.48);
  color: rgba(255, 225, 242, 0.96);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: 220ms ease;
}

.reset-btn:hover {
  box-shadow: 0 0 16px rgba(255, 129, 201, 0.35);
}
</style>
