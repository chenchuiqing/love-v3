<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import gsap from 'gsap'

const emit = defineEmits<{
  (e: 'act1Complete'): void
}>()

const PHOTO_URL = '/photo.jpg'
const containerRef = ref<HTMLElement | null>(null)
const drawingCanvasRef = ref<HTMLCanvasElement | null>(null)
const photoRef = ref<HTMLImageElement | null>(null)
const hasInteracted = ref(false)
const isCollapsing = ref(false)
const currentAct = ref<1 | 2>(1)
const showShapeHint = ref(false)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animationId = 0
let particles: THREE.Points
let particleGeometry: THREE.BufferGeometry
let particleMaterial: THREE.PointsMaterial
let particlePositions: Float32Array
let basePositions: Float32Array
let act2BasePositions: Float32Array | null = null
let firstPathPoint: THREE.Vector2 | null = null
let act2BreathingTime = 0
let shapeHintTimer: ReturnType<typeof setTimeout> | null = null

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

  if (currentAct.value === 2 && act2BasePositions) {
    act2BreathingTime += 0.03
    for (let i = 0; i < PARTICLE_COUNT; i += 20) {
      const baseY = act2BasePositions[i * 3 + 1]
      particlePositions[i * 3 + 1] = baseY + Math.sin(act2BreathingTime + i * 0.01) * 0.03
    }
    particleGeometry.attributes.position.needsUpdate = true
  }

  renderer.render(scene, camera)
}

const resizeDrawingCanvas = () => {
  if (!containerRef.value || !drawingCanvasRef.value) return
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight
  drawingCanvasRef.value.width = w
  drawingCanvasRef.value.height = h
  drawHeartOutline()
}

const drawHeartOutline = () => {
  const canvas = drawingCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const w = canvas.width
  const h = canvas.height
  const cx = w / 2
  const cy = h / 2
  // 根据屏幕尺寸缩放爱心
  const scale = Math.min(w, h) * 0.015

  ctx.save()
  ctx.translate(cx, cy - scale * 2)
  ctx.scale(scale, scale)

  ctx.beginPath()
  // 标准爱心参数方程 t: [0, 2PI]
  for (let t = 0; t <= Math.PI * 2; t += 0.05) {
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    if (t === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 0.5
  ctx.setLineDash([4, 6])
  ctx.stroke()
  ctx.restore()
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

const checkTraceCoverage = (): boolean => {
  const canvas = drawingCanvasRef.value
  if (!canvas) return false
  const w = canvas.width
  const h = canvas.height
  const cx = w / 2
  const cy = h / 2
  const scale = Math.min(w, h) * 0.015

  // 1. 生成标准的爱心轮廓上的采样点
  const heartPoints: { x: number; y: number }[] = []
  for (let t = 0; t < Math.PI * 2; t += 0.2) {
    const hx = 16 * Math.pow(Math.sin(t), 3)
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    heartPoints.push({
      x: cx + hx * scale,
      y: cy - scale * 2 + hy * scale
    })
  }

  // 2. 将世界坐标的 pathPoints 转回屏幕坐标
  const screenPathPoints = pathPoints.map(p => {
    const ndc = new THREE.Vector3(p.x, p.y, 0)
    ndc.project(camera)
    return {
      x: (ndc.x + 1) / 2 * w,
      y: -(ndc.y - 1) / 2 * h
    }
  })

  // 3. 计算覆盖率（只要离标准点足够近就算覆盖）
  let coveredCount = 0
  const thresholdDistSq = Math.pow(Math.min(w, h) * 0.08, 2) // 容差范围
  
  for (const hp of heartPoints) {
    let isCovered = false
    for (const sp of screenPathPoints) {
      const dx = hp.x - sp.x
      const dy = hp.y - sp.y
      if (dx * dx + dy * dy < thresholdDistSq) {
        isCovered = true
        break
      }
    }
    if (isCovered) coveredCount++
  }

  return (coveredCount / heartPoints.length) >= 0.75 // 75% 覆盖率即算完成
}

const isHeartRecognized = (): boolean => {
  return checkTraceCoverage()
}

const showHintTemporarily = () => {
  showShapeHint.value = true
  if (shapeHintTimer) clearTimeout(shapeHintTimer)
  shapeHintTimer = setTimeout(() => {
    showShapeHint.value = false
  }, 1500)
}

const samplePhotoTargets = (): Promise<Float32Array> =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const W = 160
      const H = Math.max(1, Math.round((W * img.height) / img.width))
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve(new Float32Array(basePositions))
        return
      }

      ctx.drawImage(img, 0, 0, W, H)
      const data = ctx.getImageData(0, 0, W, H).data
      const worldW = 7.5
      const worldH = (worldW * H) / W
      const targets = new Float32Array(PARTICLE_COUNT * 3)

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        let px = 0
        let py = 0
        let tries = 0
        do {
          px = Math.floor(Math.random() * W)
          py = Math.floor(Math.random() * H)
          const base = (py * W + px) * 4
          const gray = (data[base] + data[base + 1] + data[base + 2]) / 3
          if (Math.random() < (255 - gray) / 255 + 0.12) break
          tries += 1
        } while (tries < 30)

        targets[i * 3] = (px / W - 0.5) * worldW
        targets[i * 3 + 1] = -(py / H - 0.5) * worldH
        targets[i * 3 + 2] = (Math.random() - 0.5) * 0.1
      }
      resolve(targets)
    }
    img.onerror = () => resolve(new Float32Array(basePositions))
    img.src = PHOTO_URL
  })

const startAct2 = async () => {
  currentAct.value = 2
  clearDrawingCanvas()
  showShapeHint.value = false

  const explodeStart = new Float32Array(particlePositions)
  const explodeTargets = new Float32Array(PARTICLE_COUNT * 3)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    explodeTargets[i * 3] = (Math.random() - 0.5) * 18
    explodeTargets[i * 3 + 1] = (Math.random() - 0.5) * 10
    explodeTargets[i * 3 + 2] = (Math.random() - 0.5) * 2.2
  }

  const explodeProgress = { value: 0 }
  await new Promise<void>((resolve) => {
    gsap.to(explodeProgress, {
      value: 1,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        const p = explodeProgress.value
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particlePositions[i * 3] = THREE.MathUtils.lerp(explodeStart[i * 3], explodeTargets[i * 3], p)
          particlePositions[i * 3 + 1] = THREE.MathUtils.lerp(explodeStart[i * 3 + 1], explodeTargets[i * 3 + 1], p)
          particlePositions[i * 3 + 2] = THREE.MathUtils.lerp(explodeStart[i * 3 + 2], explodeTargets[i * 3 + 2], p)
        }
        particleGeometry.attributes.position.needsUpdate = true
      },
      onComplete: () => resolve()
    })
  })

  const photoTargets = await samplePhotoTargets()
  const morphStart = new Float32Array(particlePositions)
  const morphProgress = { value: 0 }
  await new Promise<void>((resolve) => {
    gsap.to(morphProgress, {
      value: 1,
      duration: 1.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        const p = morphProgress.value
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particlePositions[i * 3] = THREE.MathUtils.lerp(morphStart[i * 3], photoTargets[i * 3], p)
          particlePositions[i * 3 + 1] = THREE.MathUtils.lerp(morphStart[i * 3 + 1], photoTargets[i * 3 + 1], p)
          particlePositions[i * 3 + 2] = THREE.MathUtils.lerp(morphStart[i * 3 + 2], photoTargets[i * 3 + 2], p)
        }
        particleGeometry.attributes.position.needsUpdate = true
      },
      onComplete: () => resolve()
    })
  })

  act2BasePositions = new Float32Array(particlePositions)
  if (photoRef.value) {
    gsap.to(photoRef.value, {
      opacity: 0.7,
      duration: 2,
      ease: 'power2.out'
    })
  }
  emit('act1Complete')
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
    duration: 1.2,
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
    onComplete: async () => {
      await startAct2()
    }
  })
}

const clearDrawingCanvas = () => {
  const canvas = drawingCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  // 当阶段在 1 时，重绘底图
  if (currentAct.value === 1) {
    drawHeartOutline()
  }
}

const resetDrawing = () => {
  if (isCollapsing.value && currentAct.value === 1) return
  pathPoints.length = 0
  highlightedIndices.clear()
  hasInteracted.value = false
  firstPathPoint = null
  showShapeHint.value = false
  isCollapsing.value = false
  currentAct.value = 1
  act2BasePositions = null
  act2BreathingTime = 0
  clearDrawingCanvas()

  if (photoRef.value) {
    gsap.set(photoRef.value, { opacity: 0 })
  }

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
  if (isCollapsing.value || currentAct.value !== 1) return
  pointerState.isDrawing = true
  hasInteracted.value = true
  showShapeHint.value = false
  const world = screenToWorld(event.clientX, event.clientY)
  if (!firstPathPoint) {
    firstPathPoint = new THREE.Vector2(world.x, world.y)
  }
  pathPoints.push(new THREE.Vector2(world.x, world.y))
  attractParticlesToPoint(world)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!pointerState.isDrawing || isCollapsing.value || currentAct.value !== 1) return
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

  if (isHeartRecognized()) {
    animateHeartCollapse()
  } else if (pathPoints.length >= 15) {
    showHintTemporarily()
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
  if (shapeHintTimer) clearTimeout(shapeHintTimer)

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
    <img ref="photoRef" :src="PHOTO_URL" class="photo-overlay" alt="" />

    <Transition
      enter-active-class="transition-opacity duration-500"
      leave-active-class="transition-opacity duration-500"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <p v-if="!hasInteracted" class="draw-hint">用你的指尖，画出心中的形状</p>
    </Transition>
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <p v-if="showShapeHint" class="shape-hint">再多画几笔，让爱心更完整</p>
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

.photo-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  pointer-events: none;
  filter: saturate(0.92) contrast(1.02);
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

.shape-hint {
  position: absolute;
  left: 50%;
  bottom: 4.4rem;
  transform: translateX(-50%);
  margin: 0;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(180, 188, 210, 0.34);
  background: rgba(20, 24, 40, 0.45);
  color: rgba(206, 215, 233, 0.92);
  font-size: 0.76rem;
  letter-spacing: 0.03em;
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
