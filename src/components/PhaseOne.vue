<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import gsap from 'gsap';

const emit = defineEmits<{
  (e: 'complete'): void
}>();

const rootRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let animationFrameId: number;
const particleSystems: THREE.Points[] = [];
const sourcePositions: Float32Array[] = [];
const baseRotations: THREE.Euler[] = [];
let glowTexture: THREE.CanvasTexture | null = null;

const CORE_PARTICLE_COUNT = 22000;
const ARM_PARTICLE_COUNT = 18000;
const FIELD_PARTICLE_COUNT = 7000;

// 交互状态
const interactionState = ref({
  rotationSpeed: 0.001,
  convergenceFactor: 0, // 0: 原始状态, 1: 完全汇聚到中心，负值: 散开超出原始范围
  isPressing: false,
});

let pressAnimation: gsap.core.Tween | null = null;

const initScene = () => {
  if (!containerRef.value || !rootRef.value) return;

  // 1. 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#000010');

  // 2. 创建相机
  const width = rootRef.value.clientWidth;
  const height = rootRef.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 30;

  // 3. 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  containerRef.value.appendChild(renderer.domElement);

  // 4. 创建星云粒子系统
  createParticles();

  // 5. 处理窗口大小调整
  window.addEventListener('resize', onWindowResize);
};

const createParticles = () => {
  glowTexture = createGlowTexture();
  createCoreLayer();
  createSpiralLayer();
  createFieldLayer();
};

const createGlowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(225,245,255,0.85)');
    gradient.addColorStop(0.25, 'rgba(170,222,255,0.55)');
    gradient.addColorStop(0.55, 'rgba(98,172,232,0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
};

const createCoreLayer = () => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(CORE_PARTICLE_COUNT * 3);
  const colors = new Float32Array(CORE_PARTICLE_COUNT * 3);
  const cInner = new THREE.Color('#d7f0ff');
  const cMiddle = new THREE.Color('#8fd8ff');
  const cOuter = new THREE.Color('#3f98d8');

  for (let i = 0; i < CORE_PARTICLE_COUNT; i++) {
    const r = 24 * Math.pow(Math.random(), 1.5);
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI * 0.7;
    const idx = i * 3;
    const jitter = 0.65 + (r / 24) * 0.75;
    positions[idx] = r * Math.cos(phi) * Math.cos(theta) + (Math.random() - 0.5) * jitter;
    positions[idx + 1] = r * Math.sin(phi) * 1.55 + (Math.random() - 0.5) * jitter;
    positions[idx + 2] = r * Math.cos(phi) * Math.sin(theta) + (Math.random() - 0.5) * jitter;

    const t = Math.min(r / 24, 1);
    const mix = t < 0.5
      ? cInner.clone().lerp(cMiddle, t * 2)
      : cMiddle.clone().lerp(cOuter, (t - 0.5) * 2);
    colors[idx] = mix.r;
    colors[idx + 1] = mix.g;
    colors[idx + 2] = mix.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  sourcePositions.push(new Float32Array(positions));

  const material = new THREE.PointsMaterial({
    size: 0.2,
    vertexColors: true,
    map: glowTexture!,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.rotation.x = Math.PI * 0.09;
  points.rotation.z = Math.PI * 0.08;
  baseRotations.push(points.rotation.clone());
  particleSystems.push(points);
  scene.add(points);
};

const createSpiralLayer = () => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(ARM_PARTICLE_COUNT * 3);
  const colors = new Float32Array(ARM_PARTICLE_COUNT * 3);
  const armColorA = new THREE.Color('#74c8ff');
  const armColorB = new THREE.Color('#35a5ff');
  const arms = 4;

  for (let i = 0; i < ARM_PARTICLE_COUNT; i++) {
    const idx = i * 3;
    const arm = i % arms;
    const t = Math.random();
    const radius = 10 + t * 38;
    const baseAngle = (arm / arms) * Math.PI * 2;
    const swirl = t * 4.8;
    const angle = baseAngle + swirl + (Math.random() - 0.5) * 0.35;
    const spread = (1 - t) * 1.3 + 0.25;

    positions[idx] = Math.cos(angle) * radius + (Math.random() - 0.5) * spread;
    positions[idx + 1] = (Math.random() - 0.5) * (1.2 + (1 - t) * 0.8);
    positions[idx + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * spread;

    const mix = armColorA.clone().lerp(armColorB, t);
    colors[idx] = mix.r;
    colors[idx + 1] = mix.g;
    colors[idx + 2] = mix.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  sourcePositions.push(new Float32Array(positions));

  const material = new THREE.PointsMaterial({
    size: 0.28,
    vertexColors: true,
    map: glowTexture!,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.rotation.x = Math.PI * 0.1;
  baseRotations.push(points.rotation.clone());
  particleSystems.push(points);
  scene.add(points);
};

const createFieldLayer = () => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(FIELD_PARTICLE_COUNT * 3);
  const colors = new Float32Array(FIELD_PARTICLE_COUNT * 3);
  const nearColor = new THREE.Color('#bce8ff');
  const farColor = new THREE.Color('#5dafff');

  for (let i = 0; i < FIELD_PARTICLE_COUNT; i++) {
    const idx = i * 3;
    const radius = 45 + Math.random() * 95;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[idx] = radius * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = radius * Math.cos(phi) * 0.65;
    positions[idx + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const mix = nearColor.clone().lerp(farColor, Math.random());
    colors[idx] = mix.r;
    colors[idx + 1] = mix.g;
    colors[idx + 2] = mix.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  sourcePositions.push(new Float32Array(positions));

  const material = new THREE.PointsMaterial({
    size: 0.48,
    vertexColors: true,
    map: glowTexture!,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  baseRotations.push(points.rotation.clone());
  particleSystems.push(points);
  scene.add(points);
};

const onWindowResize = () => {
  if (!camera || !renderer || !rootRef.value) return;
  const width = rootRef.value.clientWidth;
  const height = rootRef.value.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};


const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  
  if (particleSystems.length > 0) {
    const speed = interactionState.value.rotationSpeed;
    particleSystems.forEach((system, layerIndex) => {
      const base = baseRotations[layerIndex];
      // 锁定基础倾角，只保留绕 Y 轴的星系自转
      system.rotation.x = base.x;
      system.rotation.z = base.z;
      system.rotation.y += speed * (1 + layerIndex * 0.28);
    });

    // 粒子位置更新（汇聚 & 散开）
    if (interactionState.value.convergenceFactor !== 0) {
      particleSystems.forEach((system, layerIndex) => {
        const positions = system.geometry.attributes.position.array as Float32Array;
        const base = sourcePositions[layerIndex];
        const factor = 1 - interactionState.value.convergenceFactor;
        for (let i = 0; i < positions.length; i++) {
          positions[i] = base[i] * factor;
        }
        system.geometry.attributes.position.needsUpdate = true;
      });
    }
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
};

const handlePointerDown = () => {
  interactionState.value.isPressing = true;

  if (pressAnimation) pressAnimation.kill();

  pressAnimation = gsap.to(interactionState.value, {
    rotationSpeed: 0.05,
    convergenceFactor: 1,
    duration: 3,
    ease: "power2.in",
    onComplete: () => {
      if (!interactionState.value.isPressing) return;

      // 极亮脉冲
      gsap.to(interactionState.value, {
        rotationSpeed: 0.12,
        duration: 0.6,
        ease: "power1.in"
      });
      particleSystems.forEach((system) => {
        gsap.to(system.material, {
          opacity: 1.0,
          duration: 0.5,
          ease: "power2.out"
        });
      });

      // 脉冲后自动散开
      setTimeout(() => {
        if (!interactionState.value.isPressing) return;

        pressAnimation = gsap.to(interactionState.value, {
          convergenceFactor: -0.3,
          rotationSpeed: 0.2,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(interactionState.value, {
              convergenceFactor: 0,
              rotationSpeed: 0.08,
              duration: 0.8,
              ease: "power1.inOut",
            });
          }
        });
        particleSystems.forEach((system) => {
          gsap.to(system.material, {
            opacity: 0.15,
            duration: 0.8,
            ease: "power2.in"
          });
        });
        emit('complete');
      }, 100);
    }
  });
};

const handlePointerUp = () => {
  interactionState.value.isPressing = false;

  if (pressAnimation) pressAnimation.kill();

  // 未完成汇聚就松开 → 恢复原状
  pressAnimation = gsap.to(interactionState.value, {
    rotationSpeed: 0.001,
    convergenceFactor: 0,
    duration: 1.5,
    ease: "power2.out"
  });
};

onMounted(() => {
  initScene();
  animate();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize);
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  if (renderer) {
    renderer.dispose();
  }
  particleSystems.forEach((system) => {
    system.geometry.dispose();
    (system.material as THREE.PointsMaterial).dispose();
  });
  if (glowTexture) {
    glowTexture.dispose();
  }
  if (containerRef.value && renderer) {
    containerRef.value.removeChild(renderer.domElement);
  }
});
</script>

<template>
  <div 
    ref="rootRef"
    class="phase-one"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
    @pointerleave="handlePointerUp"
    @contextmenu.prevent
  >
    <div ref="containerRef" class="canvas-layer"></div>
    
    <!-- UI 提示层 -->
    <div 
      class="hint-layer"
      :class="{ 'is-hidden': interactionState.isPressing }"
    >
      <div class="hint-orbit">
        <div class="hint-core"></div>
      </div>
      <p class="hint-title">按住星尘</p>
      <p class="hint-subtitle">让它为你汇聚成唯一</p>
    </div>
  </div>
</template>

<style scoped>
.phase-one {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(circle at 50% 45%, #072448 0%, #000010 70%);
  cursor: pointer;
  user-select: none;
}

.canvas-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.hint-layer {
  position: absolute;
  left: 50%;
  bottom: max(1.6rem, calc(env(safe-area-inset-bottom) + 1rem));
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  transform: translateX(-50%);
  pointer-events: none;
  opacity: 1;
  transition: opacity 360ms ease, transform 360ms ease;
}

.hint-layer.is-hidden {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

.hint-orbit {
  width: 3rem;
  height: 3rem;
  margin-bottom: 0.35rem;
  border-radius: 999px;
  border: 1px solid rgba(157, 217, 255, 0.55);
  display: grid;
  place-items: center;
  box-shadow: 0 0 24px rgba(122, 186, 255, 0.35), inset 0 0 24px rgba(121, 181, 255, 0.25);
  animation: breath 2.2s ease-in-out infinite;
}

.hint-core {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 999px;
  background: radial-gradient(circle, #f5fbff 0%, #8fd8ff 80%);
  box-shadow: 0 0 16px rgba(173, 226, 255, 0.95);
}

.hint-title {
  margin: 0;
  font-size: clamp(0.95rem, 1.45vw, 1.15rem);
  letter-spacing: 0.28em;
  color: rgba(236, 247, 255, 0.96);
  text-shadow: 0 0 16px rgba(145, 205, 255, 0.45);
}

.hint-subtitle {
  margin: 0;
  font-size: clamp(0.72rem, 1.1vw, 0.88rem);
  letter-spacing: 0.13em;
  color: rgba(192, 218, 241, 0.78);
}

@keyframes breath {
  0%,
  100% {
    transform: scale(0.98);
    opacity: 0.82;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}
</style>
