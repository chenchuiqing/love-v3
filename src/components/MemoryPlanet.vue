<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import gsap from 'gsap'
import type { Memory, PlanetPhase } from '@/types/memory'

const props = defineProps<{
  phase: PlanetPhase
  memories: Memory[]
  activeMemory: Memory | null
}>()

const emit = defineEmits<{
  (e: 'formingComplete'): void
  (e: 'nodeClick', memory: Memory): void
  (e: 'coreActivate'): void
  (e: 'zoomComplete'): void
  (e: 'returnComplete'): void
  (e: 'awakeningComplete'): void
}>()

const containerRef = ref<HTMLElement | null>(null)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animationId: number
let planetGroup: THREE.Group
let starfieldPoints: THREE.Points
let planetPoints: THREE.Points
let orbitPoints: THREE.Points
let nodeSprites: THREE.Sprite[] = []
let coreSprite: THREE.Sprite | null = null
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2
let corePulseTween: gsap.core.Tween | null = null

let planetGeometry: THREE.BufferGeometry
let orbitGeometry: THREE.BufferGeometry
let planetTargetPositions: Float32Array
let orbitTargetPositions: Float32Array
let isCoreActivated = false
const visitedIds = new Set<string>()

let isDragging = false
let previousMousePosition = { x: 0, y: 0 }
let rotationVelocity = { x: 0, y: 0 }
let hoveredSprite: THREE.Sprite | null = null

const PLANET_PARTICLE_COUNT = 35000
const ORBIT_PARTICLE_COUNT = 5000
const STARFIELD_PARTICLE_COUNT = 3000
const PLANET_RADIUS = 1.5
const INITIAL_CAMERA_Z = 5

const createGlowTexture = (color: string): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, color)
  gradient.addColorStop(0.3, color + 'aa')
  gradient.addColorStop(0.6, color + '44')
  gradient.addColorStop(1, 'transparent')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  
  return new THREE.CanvasTexture(canvas)
}

const createParticleTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')!
  
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.2, 'rgba(200, 220, 255, 0.8)')
  gradient.addColorStop(0.5, 'rgba(100, 150, 255, 0.3)')
  gradient.addColorStop(1, 'transparent')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)
  
  return new THREE.CanvasTexture(canvas)
}

const fibonacciSphere = (index: number, total: number, radius: number): THREE.Vector3 => {
  const phi = Math.acos(1 - 2 * (index + 0.5) / total)
  const theta = Math.PI * (1 + Math.sqrt(5)) * index
  
  const noise = (Math.random() - 0.5) * 0.1
  const r = radius * (1 + noise)
  
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  )
}

const sphericalToCartesian = (theta: number, phi: number, radius: number): THREE.Vector3 => {
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

const initScene = () => {
  if (!containerRef.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000010)

  camera = new THREE.PerspectiveCamera(
    60,
    containerRef.value.clientWidth / containerRef.value.clientHeight,
    0.1,
    1000
  )
  camera.position.z = INITIAL_CAMERA_Z

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.appendChild(renderer.domElement)

  raycaster = new THREE.Raycaster()
  raycaster.params.Sprite = { threshold: 0.1 }
  mouse = new THREE.Vector2()

  planetGroup = new THREE.Group()
  scene.add(planetGroup)

  createStarfield()
  createPlanetParticles()
  createOrbitParticles()
  createMemoryNodes()
  createCoreSprite()

  animate()
}

const createStarfield = () => {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(STARFIELD_PARTICLE_COUNT * 3)
  const sizes = new Float32Array(STARFIELD_PARTICLE_COUNT)

  for (let i = 0; i < STARFIELD_PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 15 + Math.random() * 35

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi)
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    sizes[i] = Math.random() * 2 + 0.5
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    size: 0.05,
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  })

  starfieldPoints = new THREE.Points(geometry, material)
  scene.add(starfieldPoints)
}

const createPlanetParticles = () => {
  planetGeometry = new THREE.BufferGeometry()
  const positions = new Float32Array(PLANET_PARTICLE_COUNT * 3)
  planetTargetPositions = new Float32Array(PLANET_PARTICLE_COUNT * 3)
  const colors = new Float32Array(PLANET_PARTICLE_COUNT * 3)

  for (let i = 0; i < PLANET_PARTICLE_COUNT; i++) {
    positions[i * 3] = 0
    positions[i * 3 + 1] = 0
    positions[i * 3 + 2] = 0

    const targetPos = fibonacciSphere(i, PLANET_PARTICLE_COUNT, PLANET_RADIUS)
    planetTargetPositions[i * 3] = targetPos.x
    planetTargetPositions[i * 3 + 1] = targetPos.y
    planetTargetPositions[i * 3 + 2] = targetPos.z

    const colorVariation = 0.7 + Math.random() * 0.3
    colors[i * 3] = 0.4 * colorVariation
    colors[i * 3 + 1] = 0.6 * colorVariation
    colors[i * 3 + 2] = 1.0 * colorVariation
  }

  planetGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  planetGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const texture = createParticleTexture()
  const material = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    map: texture,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  planetPoints = new THREE.Points(planetGeometry, material)
  planetGroup.add(planetPoints)
}

const createOrbitParticles = () => {
  orbitGeometry = new THREE.BufferGeometry()
  const positions = new Float32Array(ORBIT_PARTICLE_COUNT * 3)
  orbitTargetPositions = new Float32Array(ORBIT_PARTICLE_COUNT * 3)
  const colors = new Float32Array(ORBIT_PARTICLE_COUNT * 3)

  const orbitRadius1 = PLANET_RADIUS * 1.4
  const orbitRadius2 = PLANET_RADIUS * 1.7
  const orbitTilt1 = Math.PI * 0.15
  const orbitTilt2 = -Math.PI * 0.1

  for (let i = 0; i < ORBIT_PARTICLE_COUNT; i++) {
    positions[i * 3] = 0
    positions[i * 3 + 1] = 0
    positions[i * 3 + 2] = 0

    const isFirstOrbit = i < ORBIT_PARTICLE_COUNT / 2
    const angle = Math.random() * Math.PI * 2
    const radius = isFirstOrbit ? orbitRadius1 : orbitRadius2
    const tilt = isFirstOrbit ? orbitTilt1 : orbitTilt2
    const spread = (Math.random() - 0.5) * 0.15

    let x = radius * Math.cos(angle)
    let y = spread
    let z = radius * Math.sin(angle)

    const cosT = Math.cos(tilt)
    const sinT = Math.sin(tilt)
    const newY = y * cosT - z * sinT
    const newZ = y * sinT + z * cosT

    orbitTargetPositions[i * 3] = x
    orbitTargetPositions[i * 3 + 1] = newY
    orbitTargetPositions[i * 3 + 2] = newZ

    colors[i * 3] = 0.6 + Math.random() * 0.4
    colors[i * 3 + 1] = 0.7 + Math.random() * 0.3
    colors[i * 3 + 2] = 1.0
  }

  orbitGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  orbitGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const texture = createParticleTexture()
  const material = new THREE.PointsMaterial({
    size: 0.025,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    map: texture,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  orbitPoints = new THREE.Points(orbitGeometry, material)
  planetGroup.add(orbitPoints)
}

const createMemoryNodes = () => {
  props.memories.forEach((memory) => {
    const position = sphericalToCartesian(
      memory.position.theta,
      memory.position.phi,
      PLANET_RADIUS * memory.orbitRadius
    )

    const texture = createGlowTexture(memory.color)
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    })

    const sprite = new THREE.Sprite(material)
    sprite.position.copy(position)
    sprite.scale.set(0.25, 0.25, 1)
    sprite.userData = { memory }

    nodeSprites.push(sprite)
    planetGroup.add(sprite)
  })
}

const createCoreSprite = () => {
  const texture = createGlowTexture('#ff8ecb')
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  coreSprite = new THREE.Sprite(material)
  coreSprite.scale.set(0.15, 0.15, 1)
  coreSprite.position.set(0, 0, 0)
  planetGroup.add(coreSprite)
}

const activateCore = () => {
  if (!coreSprite || isCoreActivated) return
  isCoreActivated = true

  gsap.to(coreSprite.material, {
    opacity: 0.95,
    duration: 0.5,
    ease: 'power2.out'
  })

  corePulseTween?.kill()
  corePulseTween = gsap.to(coreSprite.scale, {
    x: 0.22,
    y: 0.22,
    duration: 0.9,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  })
}

const animateForming = () => {
  const planetPositions = planetGeometry.attributes.position.array as Float32Array
  const orbitPositions = orbitGeometry.attributes.position.array as Float32Array

  const tl = gsap.timeline({
    onComplete: () => {
      emit('formingComplete')
    }
  })

  const progressObj = { value: 0 }
  tl.to(progressObj, {
    value: 1,
    duration: 2.5,
    ease: 'power3.out',
    onUpdate: () => {
      const p = progressObj.value

      for (let i = 0; i < PLANET_PARTICLE_COUNT; i++) {
        planetPositions[i * 3] = planetTargetPositions[i * 3] * p
        planetPositions[i * 3 + 1] = planetTargetPositions[i * 3 + 1] * p
        planetPositions[i * 3 + 2] = planetTargetPositions[i * 3 + 2] * p
      }
      planetGeometry.attributes.position.needsUpdate = true

      for (let i = 0; i < ORBIT_PARTICLE_COUNT; i++) {
        orbitPositions[i * 3] = orbitTargetPositions[i * 3] * p
        orbitPositions[i * 3 + 1] = orbitTargetPositions[i * 3 + 1] * p
        orbitPositions[i * 3 + 2] = orbitTargetPositions[i * 3 + 2] * p
      }
      orbitGeometry.attributes.position.needsUpdate = true
    }
  })

  nodeSprites.forEach((sprite, index) => {
    tl.to(sprite.material, {
      opacity: 0.9,
      duration: 0.5,
      ease: 'power2.out'
    }, 1.5 + index * 0.1)
  })
}

const animateZooming = () => {
  const planetPositions = planetGeometry.attributes.position.array as Float32Array
  const orbitPositions = orbitGeometry.attributes.position.array as Float32Array

  const tl = gsap.timeline({
    onComplete: () => {
      emit('zoomComplete')
    }
  })

  nodeSprites.forEach((sprite) => {
    tl.to(sprite.material, {
      opacity: 0,
      duration: 0.3
    }, 0)
  })

  const expandObj = { value: 1 }
  tl.to(expandObj, {
    value: 2.5,
    duration: 1.2,
    ease: 'power2.in',
    onUpdate: () => {
      const scale = expandObj.value

      for (let i = 0; i < PLANET_PARTICLE_COUNT; i++) {
        planetPositions[i * 3] = planetTargetPositions[i * 3] * scale
        planetPositions[i * 3 + 1] = planetTargetPositions[i * 3 + 1] * scale
        planetPositions[i * 3 + 2] = planetTargetPositions[i * 3 + 2] * scale
      }
      planetGeometry.attributes.position.needsUpdate = true

      for (let i = 0; i < ORBIT_PARTICLE_COUNT; i++) {
        orbitPositions[i * 3] = orbitTargetPositions[i * 3] * scale
        orbitPositions[i * 3 + 1] = orbitTargetPositions[i * 3 + 1] * scale
        orbitPositions[i * 3 + 2] = orbitTargetPositions[i * 3 + 2] * scale
      }
      orbitGeometry.attributes.position.needsUpdate = true
    }
  }, 0)

  tl.to(camera.position, {
    z: 0.5,
    duration: 1.5,
    ease: 'power2.inOut'
  }, 0)

  tl.to(planetPoints.material, {
    opacity: 0.3,
    duration: 1
  }, 0.5)

  tl.to(orbitPoints.material, {
    opacity: 0.2,
    duration: 1
  }, 0.5)
}

const animateReturning = () => {
  const planetPositions = planetGeometry.attributes.position.array as Float32Array
  const orbitPositions = orbitGeometry.attributes.position.array as Float32Array

  const currentScale = planetPositions[0] / planetTargetPositions[0] || 2.5

  const tl = gsap.timeline({
    onComplete: () => {
      emit('returnComplete')
    }
  })

  tl.to(camera.position, {
    z: INITIAL_CAMERA_Z,
    duration: 1.2,
    ease: 'power2.inOut'
  }, 0)

  const shrinkObj = { value: currentScale }
  tl.to(shrinkObj, {
    value: 1,
    duration: 1.5,
    ease: 'power3.out',
    onUpdate: () => {
      const scale = shrinkObj.value

      for (let i = 0; i < PLANET_PARTICLE_COUNT; i++) {
        planetPositions[i * 3] = planetTargetPositions[i * 3] * scale
        planetPositions[i * 3 + 1] = planetTargetPositions[i * 3 + 1] * scale
        planetPositions[i * 3 + 2] = planetTargetPositions[i * 3 + 2] * scale
      }
      planetGeometry.attributes.position.needsUpdate = true

      for (let i = 0; i < ORBIT_PARTICLE_COUNT; i++) {
        orbitPositions[i * 3] = orbitTargetPositions[i * 3] * scale
        orbitPositions[i * 3 + 1] = orbitTargetPositions[i * 3 + 1] * scale
        orbitPositions[i * 3 + 2] = orbitTargetPositions[i * 3 + 2] * scale
      }
      orbitGeometry.attributes.position.needsUpdate = true
    }
  }, 0.3)

  tl.to(planetPoints.material, {
    opacity: 0.9,
    duration: 0.8
  }, 0.5)

  tl.to(orbitPoints.material, {
    opacity: 0.7,
    duration: 0.8
  }, 0.5)

  nodeSprites.forEach((sprite, index) => {
    tl.to(sprite.material, {
      opacity: 0.9,
      duration: 0.4,
      ease: 'power2.out'
    }, 1 + index * 0.08)
  })
}

const animateAwakening = () => {
  const planetPositions = planetGeometry.attributes.position.array as Float32Array
  const orbitPositions = orbitGeometry.attributes.position.array as Float32Array
  const planetStartPositions = new Float32Array(planetPositions)
  const orbitStartPositions = new Float32Array(orbitPositions)
  const planetPlaneTargets = new Float32Array(PLANET_PARTICLE_COUNT * 3)
  const orbitPlaneTargets = new Float32Array(ORBIT_PARTICLE_COUNT * 3)

  for (let i = 0; i < PLANET_PARTICLE_COUNT; i++) {
    planetPlaneTargets[i * 3] = (Math.random() - 0.5) * 16
    planetPlaneTargets[i * 3 + 1] = (Math.random() - 0.5) * 9
    planetPlaneTargets[i * 3 + 2] = (Math.random() - 0.5) * 0.08
  }

  for (let i = 0; i < ORBIT_PARTICLE_COUNT; i++) {
    orbitPlaneTargets[i * 3] = (Math.random() - 0.5) * 16
    orbitPlaneTargets[i * 3 + 1] = (Math.random() - 0.5) * 9
    orbitPlaneTargets[i * 3 + 2] = (Math.random() - 0.5) * 0.08
  }

  const tl = gsap.timeline({
    onComplete: () => {
      emit('awakeningComplete')
    }
  })

  corePulseTween?.kill()
  corePulseTween = null

  nodeSprites.forEach((sprite) => {
    tl.to(sprite.material, {
      opacity: 0,
      duration: 0.4
    }, 0)
  })

  if (coreSprite) {
    tl.to(coreSprite.material, {
      opacity: 0,
      duration: 0.5
    }, 0)
  }

  const spreadProgress = { value: 0 }
  tl.to(spreadProgress, {
    value: 1,
    duration: 2,
    ease: 'power2.inOut',
    onUpdate: () => {
      const p = spreadProgress.value

      for (let i = 0; i < PLANET_PARTICLE_COUNT; i++) {
        planetPositions[i * 3] = THREE.MathUtils.lerp(planetStartPositions[i * 3], planetPlaneTargets[i * 3], p)
        planetPositions[i * 3 + 1] = THREE.MathUtils.lerp(planetStartPositions[i * 3 + 1], planetPlaneTargets[i * 3 + 1], p)
        planetPositions[i * 3 + 2] = THREE.MathUtils.lerp(planetStartPositions[i * 3 + 2], planetPlaneTargets[i * 3 + 2], p)
      }
      planetGeometry.attributes.position.needsUpdate = true

      for (let i = 0; i < ORBIT_PARTICLE_COUNT; i++) {
        orbitPositions[i * 3] = THREE.MathUtils.lerp(orbitStartPositions[i * 3], orbitPlaneTargets[i * 3], p)
        orbitPositions[i * 3 + 1] = THREE.MathUtils.lerp(orbitStartPositions[i * 3 + 1], orbitPlaneTargets[i * 3 + 1], p)
        orbitPositions[i * 3 + 2] = THREE.MathUtils.lerp(orbitStartPositions[i * 3 + 2], orbitPlaneTargets[i * 3 + 2], p)
      }
      orbitGeometry.attributes.position.needsUpdate = true
    }
  }, 0)
}

const handlePointerDown = (event: PointerEvent) => {
  if (props.phase !== 'exploring') return
  
  isDragging = true
  previousMousePosition = { x: event.clientX, y: event.clientY }
  rotationVelocity = { x: 0, y: 0 }
}

const handlePointerMove = (event: PointerEvent) => {
  if (!containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  if (isDragging && props.phase === 'exploring') {
    const deltaX = event.clientX - previousMousePosition.x
    const deltaY = event.clientY - previousMousePosition.y

    rotationVelocity.x = deltaY * 0.002
    rotationVelocity.y = deltaX * 0.002

    previousMousePosition = { x: event.clientX, y: event.clientY }
  }

  if (props.phase === 'exploring') {
    raycaster.setFromCamera(mouse, camera)
    const hoverTargets: THREE.Object3D[] = [...nodeSprites]
    if (coreSprite && isCoreActivated) {
      hoverTargets.push(coreSprite)
    }
    const intersects = raycaster.intersectObjects(hoverTargets)

    if (intersects.length > 0) {
      const sprite = intersects[0].object as THREE.Sprite
      const isCore = coreSprite !== null && sprite === coreSprite
      if (hoveredSprite !== sprite) {
        if (hoveredSprite) {
          gsap.to(hoveredSprite.scale, { x: 0.25, y: 0.25, duration: 0.3 })
          gsap.to(hoveredSprite.material, { opacity: 0.9, duration: 0.3 })
        }
        hoveredSprite = sprite
        const targetScale = isCore ? 0.28 : 0.35
        gsap.to(sprite.scale, { x: targetScale, y: targetScale, duration: 0.3 })
        gsap.to(sprite.material, { opacity: 1, duration: 0.3 })
        document.body.style.cursor = 'pointer'
      }
    } else {
      if (hoveredSprite) {
        gsap.to(hoveredSprite.scale, { x: 0.25, y: 0.25, duration: 0.3 })
        gsap.to(hoveredSprite.material, { opacity: 0.9, duration: 0.3 })
        hoveredSprite = null
        document.body.style.cursor = 'default'
      }
    }
  }
}

const handlePointerUp = () => {
  isDragging = false
}

const handleClick = (event: MouseEvent) => {
  if (props.phase !== 'exploring' || !containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const clickTargets: THREE.Object3D[] = [...nodeSprites]
  if (coreSprite && isCoreActivated) {
    clickTargets.push(coreSprite)
  }
  const intersects = raycaster.intersectObjects(clickTargets)

  if (intersects.length > 0) {
    const sprite = intersects[0].object as THREE.Sprite
    if (coreSprite && sprite === coreSprite && isCoreActivated) {
      emit('coreActivate')
      return
    }

    const memory = sprite.userData.memory as Memory
    visitedIds.add(memory.id)
    if (visitedIds.size >= props.memories.length) {
      activateCore()
    }
    emit('nodeClick', memory)
  }
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  if (props.phase === 'exploring') {
    planetGroup.rotation.x += rotationVelocity.x
    planetGroup.rotation.y += rotationVelocity.y

    if (!isDragging) {
      rotationVelocity.x *= 0.95
      rotationVelocity.y *= 0.95

      planetGroup.rotation.y += 0.001
    }

    if (starfieldPoints) {
      starfieldPoints.rotation.y -= rotationVelocity.y * 0.3
      starfieldPoints.rotation.x -= rotationVelocity.x * 0.3
    }
  }

  renderer.render(scene, camera)
}

const handleResize = () => {
  if (!containerRef.value) return

  camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}

watch(() => props.phase, (newPhase) => {
  switch (newPhase) {
    case 'forming':
      animateForming()
      break
    case 'zooming':
      animateZooming()
      break
    case 'returning':
      animateReturning()
      break
    case 'awakening':
      animateAwakening()
      break
  }
})

onMounted(() => {
  initScene()
  window.addEventListener('resize', handleResize)

  if (props.phase === 'forming') {
    animateForming()
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
  document.body.style.cursor = 'default'

  if (renderer) {
    renderer.dispose()
  }
  if (planetGeometry) {
    planetGeometry.dispose()
  }
  if (orbitGeometry) {
    orbitGeometry.dispose()
  }
  nodeSprites.forEach((sprite) => {
    sprite.material.dispose()
  })
  if (coreSprite) {
    coreSprite.material.dispose()
  }
  corePulseTween?.kill()
})
</script>

<template>
  <div
    ref="containerRef"
    class="memory-planet"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointerleave="handlePointerUp"
    @click="handleClick"
  />
</template>

<style scoped>
.memory-planet {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
