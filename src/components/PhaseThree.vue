<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import gsap from 'gsap'

const emit = defineEmits<{
  (e: 'act1Complete'): void
}>()

const PHOTO_URL = '/photo.jpg'
const CONFESSION_LINES = [
  '那天你在地铁口等我，手里拿着热可可。',
  '那一刻我知道，被你记住，是我最大的幸运。',
  '往后的每一程星海，我都想牵着你走。'
]

const containerRef = ref<HTMLElement | null>(null)
const drawingCanvasRef = ref<HTMLCanvasElement | null>(null)
const photoRef = ref<HTMLImageElement | null>(null)
const hasInteracted = ref(false)
const isCollapsing = ref(false)
const currentAct = ref<1 | 2 | 3 | 4>(1)
const showShapeHint = ref(false)
const photoStyle = ref({ width: '0px', height: '0px', opacity: 0 })

const showEnvelopeHint = ref(false)
const showLetterOverlay = ref(false)
const typedLines = ref<string[]>(['', '', ''])
const isEnvelopeOpening = ref(false)
const isTypingFinished = ref(false)

const showHapticText = ref(false)
const showSaveBtn = ref(false)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animationId = 0
let particles: THREE.Points
let particleGeometry: THREE.BufferGeometry
let particleMaterial: THREE.PointsMaterial
let particlePositions: Float32Array
let particleColors: Float32Array
let basePositions: Float32Array
let act2BasePositions: Float32Array | null = null
let envelopeKindArr: Uint8Array | null = null
let roseTargets: Float32Array | null = null
let heartSnapshot: HTMLCanvasElement | null = null
let firstPathPoint: THREE.Vector2 | null = null
let act2BreathingTime = 0
let act4BreathingTime = 0
let shapeHintTimer: ReturnType<typeof setTimeout> | null = null
let hapticTextTimer: ReturnType<typeof setTimeout> | null = null

const PARTICLE_COUNT = 15000
const pathPoints: THREE.Vector2[] = []
/** 与 drawingCanvas 像素一致的屏幕轨迹，供识别与海报快照；避免 world→NDC 误差与抬笔后连线 */
const traceScreenPoints: { x: number; y: number }[] = []
/** 每一笔的起点在 traceScreenPoints 中的下标，快照时用 moveTo 断开，避免出现穿心竖线 */
const traceStrokeStarts: number[] = []
const highlightedIndices = new Set<number>()

const pointerState = {
  isDrawing: false
}

const envelopeTouchState = {
  startX: 0,
  startY: 0,
  startTime: 0,
  active: false
}

const act4RotateState = {
  isDragging: false,
  lastX: 0,
  lastY: 0,
  velocityX: 0,
  velocityY: 0
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

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.appendChild(renderer.domElement)

  particleGeometry = new THREE.BufferGeometry()
  particlePositions = new Float32Array(PARTICLE_COUNT * 3)
  basePositions = new Float32Array(PARTICLE_COUNT * 3)
  particleColors = new Float32Array(PARTICLE_COUNT * 3)

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

    particleColors[i * 3] = 0.88 + Math.random() * 0.12
    particleColors[i * 3 + 1] = 0.9 + Math.random() * 0.1
    particleColors[i * 3 + 2] = 1
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))

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
  
  if (currentAct.value === 1) {
    particles.rotation.z += 0.0005
  }

  if (currentAct.value === 2 && act2BasePositions) {
    act2BreathingTime += 0.03
    for (let i = 0; i < PARTICLE_COUNT; i += 20) {
      const baseY = act2BasePositions[i * 3 + 1]
      particlePositions[i * 3 + 1] = baseY + Math.sin(act2BreathingTime + i * 0.01) * 0.03
    }
    particleGeometry.attributes.position.needsUpdate = true
  }

  if (currentAct.value === 4 && roseTargets) {
    act4BreathingTime += 0.018
    // 花瓣微幅呼吸（仅对采样的稀疏粒子）
    for (let i = 0; i < PARTICLE_COUNT; i += 7) {
      const phase = act4BreathingTime + i * 0.013
      const offset = Math.sin(phase) * 0.012
      particlePositions[i * 3] = roseTargets[i * 3] + Math.cos(phase * 0.7) * 0.008
      particlePositions[i * 3 + 1] = roseTargets[i * 3 + 1] + offset
      particlePositions[i * 3 + 2] = roseTargets[i * 3 + 2] + Math.sin(phase * 0.9) * 0.008
    }
    particleGeometry.attributes.position.needsUpdate = true

    // 自由旋转 + 拖拽惯性
    if (!act4RotateState.isDragging) {
      particles.rotation.y += act4RotateState.velocityX * 0.6 + 0.0025
      particles.rotation.x += act4RotateState.velocityY * 0.6
      act4RotateState.velocityX *= 0.92
      act4RotateState.velocityY *= 0.92
    }
  }

  renderer.render(scene, camera)
}

const resizeDrawingCanvas = () => {
  if (!containerRef.value || !drawingCanvasRef.value) return
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight
  drawingCanvasRef.value.width = w
  drawingCanvasRef.value.height = h
  // 仅第一幕需要爱心引导线；后续幕 resize 时勿重绘，否则会叠在玫瑰背后
  if (currentAct.value === 1) {
    drawHeartOutline()
  }
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

  // 2. 使用真实屏幕轨迹（与 drawTrailSegment 同源），避免错误 project 导致形变
  const screenPathPoints =
    traceScreenPoints.length >= 2
      ? traceScreenPoints
      : pathPoints.map((p) => {
          const v = new THREE.Vector3(p.x, p.y, 0)
          v.project(camera)
          return {
            x: ((v.x + 1) / 2) * w,
            y: ((-v.y + 1) / 2) * h
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
      
      // 限制最大宽高，使其成为一个小相框
      let worldH = 2.6
      let worldW = worldH * (W / H)
      if (worldW > 3.5) {
        worldW = 3.5
        worldH = worldW * (H / W)
      }

      // 计算相框在屏幕上的实际像素尺寸
      const vFov = 56 * Math.PI / 180
      const visibleHeight = 2 * Math.tan(vFov / 2) * 4 // camera.z = 4
      if (containerRef.value) {
        const pixelHeight = (worldH / visibleHeight) * containerRef.value.clientHeight
        const pixelWidth = (worldW / visibleHeight) * containerRef.value.clientHeight
        photoStyle.value.width = `${pixelWidth}px`
        photoStyle.value.height = `${pixelHeight}px`
      }

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

        targets[i * 3] = ((px + 0.5) / W - 0.5) * worldW
        targets[i * 3 + 1] = -((py + 0.5) / H - 0.5) * worldH
        targets[i * 3 + 2] = (Math.random() - 0.5) * 0.1
      }
      resolve(targets)
    }
    img.onerror = () => resolve(new Float32Array(basePositions))
    img.src = PHOTO_URL
  })

/**
 * 计算信封形状的粒子目标位置。
 * kind 含义: 0=信封主体 / 1=V 形折线 / 2=封口三角翼 / 3=蜡印圆簇
 */
const computeEnvelopePositions = (): { positions: Float32Array; kinds: Uint8Array } => {
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const kinds = new Uint8Array(PARTICLE_COUNT)

  const envW = 2.6
  const envH = 1.7
  const cx = 0
  const cy = -0.25

  const halfW = envW / 2
  const halfH = envH / 2

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = Math.random()
    let kind: 0 | 1 | 2 | 3
    let x = 0
    let y = 0
    let z = (Math.random() - 0.5) * 0.06

    if (r < 0.6) {
      kind = 0
      // 矩形主体：偏向边缘的粒子密度更高
      const onEdge = Math.random() < 0.55
      if (onEdge) {
        const side = Math.floor(Math.random() * 4)
        if (side === 0) {
          x = cx - halfW + Math.random() * envW
          y = cy + halfH - Math.random() * 0.04
        } else if (side === 1) {
          x = cx - halfW + Math.random() * envW
          y = cy - halfH + Math.random() * 0.04
        } else if (side === 2) {
          x = cx - halfW + Math.random() * 0.04
          y = cy - halfH + Math.random() * envH
        } else {
          x = cx + halfW - Math.random() * 0.04
          y = cy - halfH + Math.random() * envH
        }
      } else {
        x = cx + (Math.random() - 0.5) * envW
        y = cy + (Math.random() - 0.5) * envH
      }
    } else if (r < 0.8) {
      kind = 1
      // V 形：从底角到中心顶部（顶端约位于矩形高度 60% 处）
      const apexY = cy + halfH * 0.05
      const apexX = cx
      const leftCorner = { x: cx - halfW, y: cy + halfH }
      const rightCorner = { x: cx + halfW, y: cy + halfH }
      const t = Math.random()
      const useLeft = Math.random() < 0.5
      if (useLeft) {
        x = leftCorner.x + (apexX - leftCorner.x) * t
        y = leftCorner.y + (apexY - leftCorner.y) * t
      } else {
        x = rightCorner.x + (apexX - rightCorner.x) * t
        y = rightCorner.y + (apexY - rightCorner.y) * t
      }
      x += (Math.random() - 0.5) * 0.02
      y += (Math.random() - 0.5) * 0.02
    } else if (r < 0.92) {
      kind = 2
      // 封口三角翼：上方三角（自上沿向下到 V 顶点）
      const apexY = cy + halfH * 0.05
      const topY = cy + halfH
      const t = Math.random()
      const lineY = topY - (topY - apexY) * t
      const halfSpan = halfW * (1 - t)
      x = cx + (Math.random() - 0.5) * halfSpan * 2
      y = lineY + (Math.random() - 0.5) * 0.015
      z += 0.04
    } else {
      kind = 3
      // 蜡印圆簇：信封正中略偏下
      const angle = Math.random() * Math.PI * 2
      const radius = Math.sqrt(Math.random()) * 0.16
      x = cx + Math.cos(angle) * radius
      y = cy - 0.08 + Math.sin(angle) * radius
      z += 0.05
    }

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    kinds[i] = kind
  }

  return { positions, kinds }
}

/**
 * 加载 public/rose.glb 模型，并在其表面采样计算 3D 玫瑰花的粒子目标位置。
 */
const loadRoseModelTargets = async (): Promise<Float32Array> => {
  return new Promise((resolve) => {
    const loader = new GLTFLoader()
    loader.load(
      '/rose.glb',
      (gltf) => {
        const positions = new Float32Array(PARTICLE_COUNT * 3)
        gltf.scene.updateMatrixWorld(true)
        
        const meshes: THREE.Mesh[] = []
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            meshes.push(child as THREE.Mesh)
          }
        })

        if (meshes.length === 0) {
          console.warn('No meshes found in rose.glb')
          resolve(positions)
          return
        }

        const samplers = meshes.map(mesh => ({
          sampler: new MeshSurfaceSampler(mesh).build(),
          mesh: mesh
        }))

        const _position = new THREE.Vector3()
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const { sampler, mesh } = samplers[Math.floor(Math.random() * samplers.length)]
          sampler.sample(_position)
          _position.applyMatrix4(mesh.matrixWorld)
          
          positions[i * 3] = _position.x
          positions[i * 3 + 1] = _position.y
          positions[i * 3 + 2] = _position.z
        }
        
        // Normalize and scale the positions
        const box = new THREE.Box3()
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          _position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
          box.expandByPoint(_position)
        }
        
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = maxDim > 0 ? 2.5 / maxDim : 1.0
        
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          positions[i * 3] = (positions[i * 3] - center.x) * scale
          positions[i * 3 + 1] = (positions[i * 3 + 1] - center.y) * scale + 0.2
          positions[i * 3 + 2] = (positions[i * 3 + 2] - center.z) * scale
        }
        
        resolve(positions)
      },
      undefined,
      (error) => {
        console.error('Error loading rose.glb:', error)
        resolve(new Float32Array(PARTICLE_COUNT * 3))
      }
    )
  })
}

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

  // 光影肖像先以逆时针方向转正，随后定格
  particles.rotation.z = -0.9
  gsap.to(particles.rotation, {
    z: 0,
    duration: 1.8,
    ease: 'power2.inOut'
  })

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

  // 转正后停留 3 秒，让人看清光影肖像
  await new Promise(resolve => setTimeout(resolve, 3000))

  // 3 秒内同步完成：粒子渐隐 + 照片显现，过渡更自然
  gsap.to(particleMaterial, {
    opacity: 0,
    duration: 3,
    ease: 'power2.inOut'
  })

  await new Promise<void>(resolve => {
    gsap.to(photoStyle.value, {
      opacity: 1,
      duration: 3,
      ease: 'power2.inOut',
      onComplete: () => resolve()
    })
  })

  // 照片定格观察片刻，再进入第三幕
  await new Promise(resolve => setTimeout(resolve, 1500))
  await startAct3()
}

/**
 * 全局粒子颜色过渡到指定 RGB（每分量 0~1）。
 */
const tweenParticleColors = (target: [number, number, number], duration: number) => {
  const startColors = new Float32Array(particleColors)
  const progress = { value: 0 }
  return new Promise<void>(resolve => {
    gsap.to(progress, {
      value: 1,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        const p = progress.value
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particleColors[i * 3] = THREE.MathUtils.lerp(startColors[i * 3], target[0], p)
          particleColors[i * 3 + 1] = THREE.MathUtils.lerp(startColors[i * 3 + 1], target[1], p)
          particleColors[i * 3 + 2] = THREE.MathUtils.lerp(startColors[i * 3 + 2], target[2], p)
        }
        ;(particleGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true
      },
      onComplete: () => resolve()
    })
  })
}

const startAct3 = async () => {
  currentAct.value = 3
  act2BasePositions = null

  // 计算信封目标位置
  const { positions: envPositions, kinds } = computeEnvelopePositions()
  envelopeKindArr = kinds

  const morphStart = new Float32Array(particlePositions)
  const morphProgress = { value: 0 }

  // 粒子重新显现（与照片同步淡出）
  gsap.to(particleMaterial, {
    opacity: 0.86,
    duration: 1.4,
    ease: 'power2.inOut'
  })
  gsap.to(photoStyle.value, {
    opacity: 0,
    duration: 1.4,
    ease: 'power2.inOut'
  })

  // 颜色过渡到暖金色（不阻塞）
  tweenParticleColors([1.0, 0.88, 0.6], 1.6)

  // 流沙式下坠：每个粒子带轻微随机延时，让动画更像沙子流动
  await new Promise<void>(resolve => {
    gsap.to(morphProgress, {
      value: 1,
      duration: 1.8,
      ease: 'power2.in',
      onUpdate: () => {
        const p = morphProgress.value
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          // 让粒子越靠上、越晚开始下落
          const delay = (morphStart[i * 3 + 1] + 4) / 8 * 0.2
          const adjusted = THREE.MathUtils.clamp((p - delay) / (1 - delay), 0, 1)
          const ease = adjusted * adjusted * (3 - 2 * adjusted)
          particlePositions[i * 3] = THREE.MathUtils.lerp(morphStart[i * 3], envPositions[i * 3], ease)
          particlePositions[i * 3 + 1] = THREE.MathUtils.lerp(morphStart[i * 3 + 1], envPositions[i * 3 + 1], ease)
          particlePositions[i * 3 + 2] = THREE.MathUtils.lerp(morphStart[i * 3 + 2], envPositions[i * 3 + 2], ease)
        }
        particleGeometry.attributes.position.needsUpdate = true
      },
      onComplete: () => resolve()
    })
  })

  // 信封成形，停留片刻后浮现提示
  await new Promise(resolve => setTimeout(resolve, 600))
  showEnvelopeHint.value = true
}

const typeLine = (lineIdx: number, text: string, charDelay = 90): Promise<void> =>
  new Promise(resolve => {
    let i = 0
    const tick = () => {
      i += 1
      typedLines.value[lineIdx] = text.slice(0, i)
      typedLines.value = [...typedLines.value]
      if (i < text.length) {
        setTimeout(tick, charDelay)
      } else {
        resolve()
      }
    }
    tick()
  })

const openEnvelope = async () => {
  if (isEnvelopeOpening.value || currentAct.value !== 3) return
  if (!envelopeKindArr) return
  isEnvelopeOpening.value = true
  showEnvelopeHint.value = false

  // 封口三角粒子向上散开（kind === 2）
  const flapStart = new Float32Array(PARTICLE_COUNT * 3)
  const flapTarget = new Float32Array(PARTICLE_COUNT * 3)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    flapStart[i * 3] = particlePositions[i * 3]
    flapStart[i * 3 + 1] = particlePositions[i * 3 + 1]
    flapStart[i * 3 + 2] = particlePositions[i * 3 + 2]
    if (envelopeKindArr[i] === 2) {
      flapTarget[i * 3] = particlePositions[i * 3] + (Math.random() - 0.5) * 1.6
      flapTarget[i * 3 + 1] = particlePositions[i * 3 + 1] + 0.6 + Math.random() * 0.8
      flapTarget[i * 3 + 2] = particlePositions[i * 3 + 2] + (Math.random() - 0.2) * 0.6
    } else {
      flapTarget[i * 3] = particlePositions[i * 3]
      flapTarget[i * 3 + 1] = particlePositions[i * 3 + 1]
      flapTarget[i * 3 + 2] = particlePositions[i * 3 + 2]
    }
  }

  const flapProgress = { value: 0 }
  await new Promise<void>(resolve => {
    gsap.to(flapProgress, {
      value: 1,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        const p = flapProgress.value
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          if (envelopeKindArr![i] === 2) {
            particlePositions[i * 3] = THREE.MathUtils.lerp(flapStart[i * 3], flapTarget[i * 3], p)
            particlePositions[i * 3 + 1] = THREE.MathUtils.lerp(flapStart[i * 3 + 1], flapTarget[i * 3 + 1], p)
            particlePositions[i * 3 + 2] = THREE.MathUtils.lerp(flapStart[i * 3 + 2], flapTarget[i * 3 + 2], p)
          }
        }
        particleGeometry.attributes.position.needsUpdate = true
      },
      onComplete: () => resolve()
    })
  })

  // 信纸浮层淡入
  showLetterOverlay.value = true
  await new Promise(resolve => setTimeout(resolve, 700))

  // 逐行打字机
  for (let i = 0; i < CONFESSION_LINES.length; i++) {
    await typeLine(i, CONFESSION_LINES[i], 110)
    await new Promise(resolve => setTimeout(resolve, 350))
  }

  // 等待用户手动点击继续
  isTypingFinished.value = true
}

const closeLetterAndContinue = async () => {
  if (!isTypingFinished.value) return
  isTypingFinished.value = false
  showLetterOverlay.value = false
  await new Promise(resolve => setTimeout(resolve, 600))
  await startAct4()
}

const startAct4 = async () => {
  currentAct.value = 4
  envelopeKindArr = null

  // 先导粒子：从信封中心螺旋升起
  const guideGeometry = new THREE.SphereGeometry(0.04, 16, 16)
  const guideMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff1c4,
    transparent: true,
    opacity: 1
  })
  const guide = new THREE.Mesh(guideGeometry, guideMaterial)
  guide.position.set(0, -0.25, 0.1)
  scene.add(guide)

  const guideAnim = { t: 0 }
  gsap.to(guideAnim, {
    t: 1,
    duration: 1.4,
    ease: 'power2.out',
    onUpdate: () => {
      const t = guideAnim.t
      const angle = t * Math.PI * 5
      const radius = 0.45 * (1 - t * 0.6)
      guide.position.x = Math.cos(angle) * radius
      guide.position.y = -0.25 + t * 0.65
      guide.position.z = Math.sin(angle) * radius * 0.6 + 0.1
    },
    onComplete: () => {
      gsap.to(guideMaterial, {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
          scene.remove(guide)
          guideGeometry.dispose()
          guideMaterial.dispose()
        }
      })
    }
  })

  // 同步进行：粒子颜色由暖金过渡到深红
  tweenParticleColors([0.95, 0.1, 0.18], 1.8)

  // 计算玫瑰目标
  const roseTargetsLocal = await loadRoseModelTargets()
  roseTargets = roseTargetsLocal

  const morphStart = new Float32Array(particlePositions)
  const morphProgress = { value: 0 }

  // 让 morph 在视觉上像"螺旋汇流"：基于角度施加延时
  await new Promise<void>(resolve => {
    gsap.to(morphProgress, {
      value: 1,
      duration: 2.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        const p = morphProgress.value
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const angle = Math.atan2(morphStart[i * 3 + 1] + 0.25, morphStart[i * 3])
          const delay = ((angle + Math.PI) / (2 * Math.PI)) * 0.25
          const adjusted = THREE.MathUtils.clamp((p - delay) / (1 - delay), 0, 1)
          const ease = adjusted * adjusted * (3 - 2 * adjusted)

          // 路径中途加入轻微的螺旋扰动
          const swirl = Math.sin(ease * Math.PI) * 0.08
          const cosS = Math.cos(swirl)
          const sinS = Math.sin(swirl)

          const lx = THREE.MathUtils.lerp(morphStart[i * 3], roseTargetsLocal[i * 3], ease)
          const ly = THREE.MathUtils.lerp(morphStart[i * 3 + 1], roseTargetsLocal[i * 3 + 1], ease)
          const lz = THREE.MathUtils.lerp(morphStart[i * 3 + 2], roseTargetsLocal[i * 3 + 2], ease)

          particlePositions[i * 3] = lx * cosS - lz * sinS
          particlePositions[i * 3 + 1] = ly
          particlePositions[i * 3 + 2] = lx * sinS + lz * cosS
        }
        particleGeometry.attributes.position.needsUpdate = true
      },
      onComplete: () => resolve()
    })
  })

  // 玫瑰稳定后：调亮一些以表现"绽放"
  gsap.to(particleMaterial, {
    opacity: 0.95,
    size: 0.04,
    duration: 0.8,
    ease: 'power2.out'
  })

  // 延迟显示保存按钮
  setTimeout(() => {
    showSaveBtn.value = true
  }, 2000)

  emit('act1Complete')
}

const triggerRoseHaptic = () => {
  if (currentAct.value !== 4) return
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(50)
    } catch {
      // ignore
    }
  }
  showHapticText.value = true
  if (hapticTextTimer) clearTimeout(hapticTextTimer)
  hapticTextTimer = setTimeout(() => {
    showHapticText.value = false
  }, 2000)
}

const handleSavePoster = () => {
  if (!renderer || !containerRef.value) return
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight

  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')
  if (!ctx) return

  // 背景：与场景同色，避免黑底硬边
  ctx.fillStyle = '#000010'
  ctx.fillRect(0, 0, w, h)
  // 渲染当前 WebGL 帧到 2D 画布
  renderer.render(scene, camera)
  ctx.drawImage(renderer.domElement, 0, 0, w, h)

  // 角落叠加她手绘的爱心（她创作的印记）
  if (heartSnapshot) {
    const targetW = Math.min(180, w * 0.22)
    const ratio = heartSnapshot.height / heartSnapshot.width
    const targetH = targetW * ratio
    const margin = Math.max(20, Math.floor(w * 0.035))
    ctx.save()
    ctx.globalAlpha = 0.78
    ctx.drawImage(heartSnapshot, w - targetW - margin, margin, targetW, targetH)
    ctx.restore()

    // 给爱心配一个克制的小标签
    ctx.save()
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(255, 220, 230, 0.65)'
    ctx.font = `${Math.max(11, Math.floor(w * 0.012))}px "PingFang SC", "Microsoft YaHei", serif`
    ctx.fillText('— 由你亲手画下', w - margin, margin + targetH + 18)
    ctx.restore()
  }

  // 在底部叠加告白文字
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255, 226, 232, 0.95)'
  ctx.shadowColor = 'rgba(255, 80, 120, 0.5)'
  ctx.shadowBlur = 12
  const lineHeight = Math.max(22, Math.floor(h * 0.034))
  const baseY = h - lineHeight * (CONFESSION_LINES.length + 1)
  ctx.font = `${Math.floor(lineHeight * 0.7)}px "PingFang SC", "Microsoft YaHei", serif`
  for (let i = 0; i < CONFESSION_LINES.length; i++) {
    ctx.fillText(CONFESSION_LINES[i], w / 2, baseY + i * lineHeight)
  }
  ctx.shadowBlur = 0

  const link = document.createElement('a')
  link.download = 'love-letter.png'
  link.href = out.toDataURL('image/png')
  link.click()
}

/**
 * 在塌缩开始时把用户手绘爱心的笔触快照保存下来，
 * 供第四幕"留住这一刻"合成海报时使用。
 */
const snapshotHeartTrace = () => {
  if (!drawingCanvasRef.value) return
  const cw = drawingCanvasRef.value.width
  const ch = drawingCanvasRef.value.height

  const screenPoints =
    traceScreenPoints.length >= 2
      ? traceScreenPoints
      : pathPoints.length >= 2
        ? pathPoints.map((p) => {
            const v = new THREE.Vector3(p.x, p.y, 0)
            v.project(camera)
            return {
              x: ((v.x + 1) / 2) * cw,
              y: ((-v.y + 1) / 2) * ch
            }
          })
        : []

  if (screenPoints.length < 2) return

  const strokeStartSet = new Set(traceStrokeStarts)

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of screenPoints) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }

  const padding = 36
  const bw = Math.max(1, Math.ceil(maxX - minX + padding * 2))
  const bh = Math.max(1, Math.ceil(maxY - minY + padding * 2))

  const snap = document.createElement('canvas')
  snap.width = bw
  snap.height = bh
  const ctx = snap.getContext('2d')
  if (!ctx) return

  const minSpan = Math.min(bw, bh)
  const maxJoinSq = Math.pow(minSpan * 0.14, 2)

  // 用与绘制时一致的笔触样式重画，保留她笔下的发光质感
  ctx.strokeStyle = 'rgba(255, 211, 236, 0.95)'
  ctx.lineWidth = 3.2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowBlur = 14
  ctx.shadowColor = 'rgba(255, 108, 176, 0.85)'
  ctx.beginPath()
  for (let i = 0; i < screenPoints.length; i++) {
    const x = screenPoints[i].x - minX + padding
    const y = screenPoints[i].y - minY + padding
    let useMove = i === 0 || strokeStartSet.has(i)
    if (!useMove && i > 0) {
      const px = screenPoints[i - 1].x - minX + padding
      const py = screenPoints[i - 1].y - minY + padding
      const dsq = (x - px) * (x - px) + (y - py) * (y - py)
      if (dsq > maxJoinSq) useMove = true
    }
    if (useMove) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  heartSnapshot = snap
}

const animateHeartCollapse = () => {
  if (isCollapsing.value || highlightedIndices.size === 0) return
  isCollapsing.value = true
  snapshotHeartTrace()

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
  traceScreenPoints.length = 0
  traceStrokeStarts.length = 0
  highlightedIndices.clear()
  hasInteracted.value = false
  firstPathPoint = null
  showShapeHint.value = false
  isCollapsing.value = false
  currentAct.value = 1
  act2BasePositions = null
  act2BreathingTime = 0
  act4BreathingTime = 0
  envelopeKindArr = null
  roseTargets = null
  heartSnapshot = null
  showEnvelopeHint.value = false
  showLetterOverlay.value = false
  showHapticText.value = false
  showSaveBtn.value = false
  isEnvelopeOpening.value = false
  typedLines.value = ['', '', '']
  act4RotateState.isDragging = false
  act4RotateState.velocityX = 0
  act4RotateState.velocityY = 0
  clearDrawingCanvas()

  gsap.killTweensOf(particleMaterial)
  if (particleMaterial) {
    particleMaterial.opacity = 0.86
    particleMaterial.size = 0.035
  }
  gsap.killTweensOf(photoStyle.value)
  photoStyle.value.opacity = 0

  // 颜色复位为银白
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particleColors[i * 3] = 0.88 + Math.random() * 0.12
    particleColors[i * 3 + 1] = 0.9 + Math.random() * 0.1
    particleColors[i * 3 + 2] = 1
  }
  ;(particleGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true

  particles.rotation.set(0, 0, 0)

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
  if (currentAct.value === 1) {
    if (isCollapsing.value) return
    pointerState.isDrawing = true
    hasInteracted.value = true
    showShapeHint.value = false
    const rect = containerRef.value!.getBoundingClientRect()
    traceStrokeStarts.push(traceScreenPoints.length)
    traceScreenPoints.push({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    })
    const world = screenToWorld(event.clientX, event.clientY)
    if (!firstPathPoint) {
      firstPathPoint = new THREE.Vector2(world.x, world.y)
    }
    pathPoints.push(new THREE.Vector2(world.x, world.y))
    attractParticlesToPoint(world)
    return
  }

  if (currentAct.value === 3 && !isEnvelopeOpening.value && !showLetterOverlay.value) {
    envelopeTouchState.startX = event.clientX
    envelopeTouchState.startY = event.clientY
    envelopeTouchState.startTime = Date.now()
    envelopeTouchState.active = true
    return
  }

  if (currentAct.value === 4) {
    act4RotateState.isDragging = true
    act4RotateState.lastX = event.clientX
    act4RotateState.lastY = event.clientY
    act4RotateState.velocityX = 0
    act4RotateState.velocityY = 0
  }
}

const handlePointerMove = (event: PointerEvent) => {
  if (currentAct.value === 1) {
    if (!pointerState.isDrawing || isCollapsing.value) return
    const previousEvent = (handlePointerMove as unknown as { prev?: PointerEvent }).prev
    if (previousEvent) {
      drawTrailSegment(previousEvent, event)
    }
    ;(handlePointerMove as unknown as { prev?: PointerEvent }).prev = event

    const rect = containerRef.value!.getBoundingClientRect()
    traceScreenPoints.push({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    })
    const world = screenToWorld(event.clientX, event.clientY)
    pathPoints.push(new THREE.Vector2(world.x, world.y))
    attractParticlesToPoint(world)
    return
  }

  if (currentAct.value === 4 && act4RotateState.isDragging) {
    const dx = event.clientX - act4RotateState.lastX
    const dy = event.clientY - act4RotateState.lastY
    const rotY = dx * 0.005
    const rotX = dy * 0.005
    particles.rotation.y += rotY
    particles.rotation.x = THREE.MathUtils.clamp(particles.rotation.x + rotX, -0.9, 0.9)
    act4RotateState.velocityX = rotY
    act4RotateState.velocityY = rotX
    act4RotateState.lastX = event.clientX
    act4RotateState.lastY = event.clientY
  }
}

const handlePointerUp = (event: PointerEvent) => {
  if (currentAct.value === 1) {
    if (!pointerState.isDrawing) return
    pointerState.isDrawing = false
    ;(handlePointerMove as unknown as { prev?: PointerEvent }).prev = undefined

    if (isHeartRecognized()) {
      animateHeartCollapse()
    } else if (pathPoints.length >= 15) {
      showHintTemporarily()
    }
    return
  }

  if (currentAct.value === 3 && envelopeTouchState.active) {
    envelopeTouchState.active = false
    const dx = event.clientX - envelopeTouchState.startX
    const dy = event.clientY - envelopeTouchState.startY
    const dt = Date.now() - envelopeTouchState.startTime
    const distance = Math.hypot(dx, dy)
    const isSwipeUp = dy < -30 && Math.abs(dy) > Math.abs(dx)
    const isTap = distance < 12 && dt < 350
    if (isSwipeUp || isTap) {
      openEnvelope()
    }
    return
  }

  if (currentAct.value === 4 && act4RotateState.isDragging) {
    act4RotateState.isDragging = false
    const dx = event.clientX - act4RotateState.lastX
    const dy = event.clientY - act4RotateState.lastY
    const distance = Math.hypot(dx, dy)
    // 小幅滑动视为点击 → 触发触觉反馈
    if (distance < 6) {
      triggerRoseHaptic()
    }
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
    <canvas v-show="currentAct === 1" ref="drawingCanvasRef" class="drawing-layer" />
    <img ref="photoRef" :src="PHOTO_URL" class="photo-frame" :style="photoStyle" alt="" />

    <Transition
      enter-active-class="transition-opacity duration-500"
      leave-active-class="transition-opacity duration-500"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <p v-if="!hasInteracted && currentAct === 1" class="draw-hint">用你的指尖，画出心中的形状</p>
    </Transition>
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <p v-if="showShapeHint" class="shape-hint">再多画几笔，让爱心更完整</p>
    </Transition>

    <Transition
      enter-active-class="transition-opacity duration-700"
      leave-active-class="transition-opacity duration-500"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <p v-if="showEnvelopeHint && !showLetterOverlay" class="envelope-hint">
        轻轻滑开，看看里面
      </p>
    </Transition>

    <Transition
      enter-active-class="transition-opacity duration-700"
      leave-active-class="transition-opacity duration-500"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="showLetterOverlay" class="letter-overlay">
        <div class="letter-card">
          <div class="letter-header">
            <span class="letter-line"></span>
            <span class="letter-date">致 你</span>
            <span class="letter-line"></span>
          </div>
          <div class="letter-text">
            <p v-for="(line, i) in typedLines" :key="i" class="letter-paragraph">
              {{ line }}<span v-if="line && i === typedLines.length - 1" class="cursor">|</span>
            </p>
          </div>
          <div class="letter-footer">— 永远爱你的人</div>
        </div>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition-opacity duration-700"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="showLetterOverlay && isTypingFinished" class="continue-action">
        <button class="continue-btn" @click.stop="closeLetterAndContinue">继续</button>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-700"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <p v-if="showHapticText" class="haptic-text">我的心，始终随你而动。</p>
    </Transition>

    <Transition
      enter-active-class="transition-opacity duration-700"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <button v-if="showSaveBtn" class="save-btn" @click="handleSavePoster">留住这一刻</button>
    </Transition>

    <button v-if="currentAct === 1" class="reset-btn" @click="resetDrawing">重新画</button>
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

.photo-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  object-fit: cover;
  border: 6px solid rgba(255, 255, 255, 0.95);
  border-radius: 4px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 24px rgba(255, 255, 255, 0.2);
  pointer-events: none;
  filter: saturate(0.95) contrast(1.05);
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

.envelope-hint {
  position: absolute;
  left: 50%;
  bottom: 18%;
  transform: translateX(-50%);
  margin: 0;
  padding: 0.55rem 1.25rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 220, 160, 0.5);
  background: rgba(45, 25, 8, 0.45);
  color: rgba(255, 240, 210, 0.95);
  font-size: 0.86rem;
  letter-spacing: 0.06em;
  white-space: nowrap;
  text-shadow: 0 0 12px rgba(255, 196, 120, 0.45);
  animation: gentle-pulse 2.4s ease-in-out infinite;
}

@keyframes gentle-pulse {
  0%, 100% { opacity: 0.85; transform: translateX(-50%) translateY(0); }
  50% { opacity: 1; transform: translateX(-50%) translateY(-3px); }
}

.letter-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 50%, rgba(15, 5, 25, 0.55) 0%, rgba(0, 0, 16, 0.78) 80%);
  z-index: 10;
  padding: 1.5rem;
}

.letter-card {
  width: min(420px, 88vw);
  padding: 2rem 1.8rem;
  border-radius: 16px;
  background: linear-gradient(155deg, rgba(252, 244, 228, 0.96), rgba(244, 228, 208, 0.92));
  color: #5a3a2a;
  box-shadow: 0 24px 72px rgba(0, 0, 0, 0.55), 0 0 32px rgba(255, 196, 120, 0.18);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 220, 180, 0.4);
}

.letter-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.3rem;
}

.letter-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(140, 90, 50, 0.4), transparent);
}

.letter-date {
  font-size: 0.78rem;
  letter-spacing: 0.3em;
  color: rgba(140, 90, 50, 0.85);
}

.letter-text {
  font-family: 'KaiTi', 'STKaiti', 'PingFang SC', serif;
  font-size: 1.05rem;
  line-height: 2;
  letter-spacing: 0.05em;
  min-height: 6.3em;
}

.letter-paragraph {
  margin: 0 0 0.4em 0;
}

.cursor {
  display: inline-block;
  margin-left: 2px;
  color: rgba(180, 100, 60, 0.85);
  animation: blink 0.9s steps(1) infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.letter-footer {
  margin-top: 1.4rem;
  text-align: right;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  color: rgba(140, 90, 50, 0.7);
}

.continue-action {
  position: absolute;
  right: 1.2rem;
  bottom: 1.2rem;
  z-index: 20;
}

.continue-btn {
  padding: 0.55rem 1.15rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 186, 222, 0.45);
  background: rgba(30, 8, 33, 0.48);
  color: rgba(255, 225, 242, 0.96);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: gentle-pulse 2.4s ease-in-out infinite;
}

.continue-btn:hover {
  background: rgba(45, 12, 50, 0.6);
  border-color: rgba(255, 129, 201, 0.6);
  box-shadow: 0 0 16px rgba(255, 129, 201, 0.35);
  transform: translateY(-1px);
}

.haptic-text {
  position: absolute;
  left: 50%;
  top: 12%;
  transform: translateX(-50%);
  margin: 0;
  padding: 0.55rem 1.4rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 150, 170, 0.45);
  background: rgba(50, 6, 18, 0.55);
  color: rgba(255, 220, 230, 0.96);
  font-size: 0.88rem;
  letter-spacing: 0.08em;
  text-shadow: 0 0 14px rgba(255, 80, 120, 0.55);
  white-space: nowrap;
}

.save-btn {
  position: absolute;
  right: 1.2rem;
  bottom: 1.2rem;
  z-index: 5;
  padding: 0.55rem 1.15rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 200, 220, 0.5);
  background: rgba(40, 8, 24, 0.55);
  color: rgba(255, 232, 240, 0.96);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: 240ms ease;
}

.save-btn:hover {
  box-shadow: 0 0 18px rgba(255, 120, 170, 0.5);
  transform: translateY(-1px);
}
</style>
