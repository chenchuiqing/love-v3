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
const currentAct = ref<1 | 2 | 3 | 4>(1)
const showShapeHint = ref(false)
const photoStyle = ref({ width: '0px', height: '0px', opacity: 0 })

const showEnvelopeHint = ref(false)
const envelopeOpened = ref(false)
const envelopeText = ref('')
const envelopeFullText = '那天你在地铁口等我，手里拿着热可可。\n那一刻我知道，被你记住，是我最大的幸运。'

const showRoseMessage = ref(false)
const showPosterBtn = ref(false)
const isRoseRotating = ref(false)

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
  
  if (currentAct.value === 1) {
    particles.rotation.z += 0.0005
  } else if (isRoseRotating.value) {
    particles.rotation.z += 0.002
    particles.rotation.x += 0.001
    particles.rotation.y += 0.001
  }

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

  await new Promise(resolve => setTimeout(resolve, 3000))

  await startAct3()
}

const sampleEnvelopeTargets = (): Float32Array => {
  const targets = new Float32Array(PARTICLE_COUNT * 3)
  const w = 4.0
  const h = 2.4
  const cy = -1.5 
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const rand = Math.random()
    let x, y
    if (rand < 0.2) { 
      x = (Math.random() - 0.5) * w
      y = cy + h/2 - Math.abs(x) * 0.6 
    } else if (rand < 0.4) { 
      x = (Math.random() - 0.5) * w
      y = cy - h/2
    } else if (rand < 0.5) { 
      x = -w/2
      y = cy + (Math.random() - 0.5) * h
    } else if (rand < 0.6) { 
      x = w/2
      y = cy + (Math.random() - 0.5) * h
    } else { 
      x = (Math.random() - 0.5) * w
      y = cy + (Math.random() - 0.5) * h
    }
    targets[i * 3] = x
    targets[i * 3 + 1] = y
    targets[i * 3 + 2] = (Math.random() - 0.5) * 0.1
  }
  return targets
}

const startAct3 = async () => {
  currentAct.value = 3
  
  gsap.to(photoStyle.value, {
    opacity: 0,
    duration: 1.5,
    ease: 'power2.inOut'
  })
  
  gsap.to(particleMaterial, {
    opacity: 0.86,
    duration: 1.5,
    ease: 'power2.inOut'
  })
  
  const targets = sampleEnvelopeTargets()
  const start = new Float32Array(particlePositions)
  const progress = { value: 0 }
  
  gsap.to(particles.rotation, {
    z: 0,
    duration: 2.5,
    ease: 'power2.out'
  })
  
  await new Promise<void>(resolve => {
    gsap.to(progress, {
      value: 1,
      duration: 2.5,
      ease: 'power2.out',
      onUpdate: () => {
        const p = progress.value
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particlePositions[i * 3] = THREE.MathUtils.lerp(start[i * 3], targets[i * 3], p)
          particlePositions[i * 3 + 1] = THREE.MathUtils.lerp(start[i * 3 + 1], targets[i * 3 + 1], p)
          particlePositions[i * 3 + 2] = THREE.MathUtils.lerp(start[i * 3 + 2], targets[i * 3 + 2], p)
        }
        particleGeometry.attributes.position.needsUpdate = true
      },
      onComplete: () => resolve()
    })
  })
  
  showEnvelopeHint.value = true
}

const openEnvelope = async () => {
  if (envelopeOpened.value) return
  envelopeOpened.value = true
  showEnvelopeHint.value = false
  
  const start = new Float32Array(particlePositions)
  const targets = new Float32Array(PARTICLE_COUNT * 3)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (Math.random() < 0.6) {
      targets[i * 3] = (Math.random() - 0.5) * 12
      targets[i * 3 + 1] = Math.random() * 8 - 2
      targets[i * 3 + 2] = (Math.random() - 0.5) * 2
    } else {
      targets[i * 3] = start[i * 3]
      targets[i * 3 + 1] = start[i * 3 + 1]
      targets[i * 3 + 2] = start[i * 3 + 2]
    }
  }
  
  const progress = { value: 0 }
  gsap.to(progress, {
    value: 1,
    duration: 2,
    ease: 'power2.out',
    onUpdate: () => {
      const p = progress.value
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlePositions[i * 3] = THREE.MathUtils.lerp(start[i * 3], targets[i * 3], p)
        particlePositions[i * 3 + 1] = THREE.MathUtils.lerp(start[i * 3 + 1], targets[i * 3 + 1], p)
        particlePositions[i * 3 + 2] = THREE.MathUtils.lerp(start[i * 3 + 2], targets[i * 3 + 2], p)
      }
      particleGeometry.attributes.position.needsUpdate = true
    }
  })
  
  let currentLength = 0
  const interval = setInterval(() => {
    currentLength++
    envelopeText.value = envelopeFullText.substring(0, currentLength)
    if (currentLength >= envelopeFullText.length) {
      clearInterval(interval)
      setTimeout(() => {
        startAct4()
      }, 3000)
    }
  }, 100)
}

const sampleRoseTargets = (): Float32Array => {
  const targets = new Float32Array(PARTICLE_COUNT * 3)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = i * 2.39996 
    const r = 0.05 * Math.sqrt(i)
    const z = -0.2 * r * r + (Math.random() - 0.5) * 0.2
    
    const jitter = 0.1
    targets[i * 3] = r * Math.cos(theta) + (Math.random() - 0.5) * jitter
    targets[i * 3 + 1] = r * Math.sin(theta) + (Math.random() - 0.5) * jitter
    targets[i * 3 + 2] = z
  }
  return targets
}

const startAct4 = async () => {
  currentAct.value = 4
  
  envelopeText.value = ''
  
  const targets = sampleRoseTargets()
  const start = new Float32Array(particlePositions)
  const progress = { value: 0 }
  
  const colors = particleGeometry.attributes.color.array as Float32Array
  const startColors = new Float32Array(colors)
  
  await new Promise<void>(resolve => {
    gsap.to(progress, {
      value: 1,
      duration: 3,
      ease: 'power3.inOut',
      onUpdate: () => {
        const p = progress.value
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particlePositions[i * 3] = THREE.MathUtils.lerp(start[i * 3], targets[i * 3], p)
          particlePositions[i * 3 + 1] = THREE.MathUtils.lerp(start[i * 3 + 1], targets[i * 3 + 1], p)
          particlePositions[i * 3 + 2] = THREE.MathUtils.lerp(start[i * 3 + 2], targets[i * 3 + 2], p)
          
          colors[i * 3] = THREE.MathUtils.lerp(startColors[i * 3], 1.0, p) 
          colors[i * 3 + 1] = THREE.MathUtils.lerp(startColors[i * 3 + 1], 0.1 + Math.random() * 0.1, p) 
          colors[i * 3 + 2] = THREE.MathUtils.lerp(startColors[i * 3 + 2], 0.1 + Math.random() * 0.1, p) 
        }
        particleGeometry.attributes.position.needsUpdate = true
        particleGeometry.attributes.color.needsUpdate = true
      },
      onComplete: () => resolve()
    })
  })
  
  isRoseRotating.value = true
  showPosterBtn.value = true
}

const handleRoseClick = () => {
  if (currentAct.value === 4) {
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    showRoseMessage.value = true
    setTimeout(() => {
      showRoseMessage.value = false
    }, 2000)
  }
}

const savePoster = () => {
  emit('act1Complete') // trigger next phase or complete
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

  gsap.killTweensOf(particleMaterial)
  if (particleMaterial) {
    particleMaterial.opacity = 0.86
  }
  gsap.killTweensOf(photoStyle.value)
  photoStyle.value.opacity = 0

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
  if (currentAct.value === 4) {
    handleRoseClick()
    return
  }
  if (currentAct.value === 3 && showEnvelopeHint.value) {
    openEnvelope()
    return
  }
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
    <img ref="photoRef" :src="PHOTO_URL" class="photo-frame" :style="photoStyle" alt="" />

    <!-- Act 1 & 2 hints -->
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
      <p v-if="showShapeHint && currentAct === 1" class="shape-hint">再多画几笔，让爱心更完整</p>
    </Transition>

    <button v-if="currentAct === 1" class="reset-btn" @click="resetDrawing">重新画</button>

    <!-- Act 3 Envelope -->
    <Transition
      enter-active-class="transition-opacity duration-800"
      leave-active-class="transition-opacity duration-500"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="currentAct === 3" class="act3-layer">
        <p v-if="showEnvelopeHint" class="envelope-click-hint">轻轻滑开，看看里面</p>
        <div v-if="envelopeText" class="envelope-text">
          <p v-for="(line, index) in envelopeText.split('\n')" :key="index">{{ line }}</p>
        </div>
      </div>
    </Transition>

    <!-- Act 4 Rose -->
    <Transition
      enter-active-class="transition-opacity duration-800"
      leave-active-class="transition-opacity duration-500"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="currentAct === 4" class="act4-layer">
        <Transition
          enter-active-class="transition-opacity duration-500"
          leave-active-class="transition-opacity duration-500"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <p v-if="showRoseMessage" class="rose-message">我的心，始终随你而动。</p>
        </Transition>
        <button v-if="showPosterBtn" class="poster-btn" @click.stop="savePoster">留住这一刻</button>
      </div>
    </Transition>
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

.act3-layer, .act4-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.envelope-click-hint {
  position: absolute;
  bottom: 25%;
  margin: 0;
  padding: 0.52rem 1.1rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  backdrop-filter: blur(4px);
  animation: pulse 2s infinite ease-in-out;
}

.envelope-text {
  position: absolute;
  top: 40%;
  max-width: 80%;
  text-align: center;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1rem;
  line-height: 1.8;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8);
}

.rose-message {
  position: absolute;
  top: 20%;
  margin: 0;
  color: rgba(255, 180, 200, 0.95);
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  text-shadow: 0 0 12px rgba(255, 50, 100, 0.6);
}

.poster-btn {
  position: absolute;
  right: 1.5rem;
  bottom: 1.5rem;
  padding: 0.5rem 1.2rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 100, 150, 0.5);
  background: rgba(20, 5, 10, 0.6);
  color: rgba(255, 200, 220, 0.95);
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
}

.poster-btn:hover {
  background: rgba(255, 50, 100, 0.3);
  box-shadow: 0 0 20px rgba(255, 50, 100, 0.4);
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}
</style>
