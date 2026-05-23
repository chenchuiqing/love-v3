<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMusicPlayerStore } from '@/stores/musicPlayer'

const musicPlayer = useMusicPlayerStore()
const isCollapsed = ref(false)

watch(
  () => musicPlayer.isVisible,
  (visible) => {
    if (!visible) isCollapsed.value = false
  }
)

const formatTime = (sec: number) => {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const currentTimeText = computed(() => formatTime(musicPlayer.currentTime))
const durationText = computed(() => formatTime(musicPlayer.duration))

const handleSeek = (event: Event) => {
  const target = event.target as HTMLInputElement
  const ratio = Number(target.value) / 100
  musicPlayer.seek(ratio * (musicPlayer.duration || 0))
}

const handleToggle = () => {
  musicPlayer.toggle()
}

const handleVinylClick = () => {
  if (isCollapsed.value) {
    isCollapsed.value = false
    return
  }
  handleToggle()
}

const handleCollapse = () => {
  isCollapsed.value = true
}

const handleClose = () => {
  musicPlayer.close()
}

const waveBars = [0, 1, 2, 3, 4]
</script>

<template>
  <Transition name="player-rise">
    <div
      v-if="musicPlayer.isVisible"
      class="floating-player"
      :class="{ 'is-collapsed': isCollapsed }"
      role="region"
      :aria-label="isCollapsed ? '音乐播放器（已收起，点击展开）' : '正在播放'"
    >
      <!-- 光环涟漪 -->
      <div class="aura" :class="{ 'is-playing': musicPlayer.isPlaying }">
        <span class="aura-ring aura-ring-1" />
        <span class="aura-ring aura-ring-2" />
        <span class="aura-ring aura-ring-3" />
      </div>

      <div class="player-card" :class="{ 'is-collapsed': isCollapsed }">
        <!-- 黑胶唱片 -->
        <div
          class="vinyl-wrapper"
          :title="isCollapsed ? '点击展开播放器' : undefined"
          @click="handleVinylClick"
        >
          <div class="vinyl" :class="{ 'is-playing': musicPlayer.isPlaying }">
            <div class="vinyl-grooves" />
            <div
              class="vinyl-cover"
              :style="musicPlayer.currentCover ? { backgroundImage: `url(${musicPlayer.currentCover})` } : {}"
            >
              <span v-if="!musicPlayer.currentCover" class="vinyl-note">♪</span>
            </div>
            <div class="vinyl-center" />
          </div>
          <div class="vinyl-arm" :class="{ 'is-playing': musicPlayer.isPlaying }" />
        </div>

        <!-- 信息与进度 -->
        <div v-show="!isCollapsed" class="info">
          <div class="title-row">
            <span class="now-label">NOW PLAYING</span>
            <span class="title" :title="musicPlayer.currentTitle">{{ musicPlayer.currentTitle }}</span>
          </div>

          <div class="progress-row">
            <span class="time">{{ currentTimeText }}</span>
            <div class="progress-track-wrap">
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: `${musicPlayer.progress}%` }" />
                <div class="progress-thumb" :style="{ left: `${musicPlayer.progress}%` }" />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                :value="musicPlayer.progress"
                class="progress-input"
                @input="handleSeek"
                aria-label="播放进度"
              />
            </div>
            <span class="time">{{ durationText }}</span>
          </div>
        </div>

        <!-- 音波 -->
        <div
          v-show="!isCollapsed"
          class="wave"
          :class="{ 'is-playing': musicPlayer.isPlaying }"
          aria-hidden="true"
        >
          <span
            v-for="i in waveBars"
            :key="i"
            class="wave-bar"
            :style="{ animationDelay: `${i * 0.12}s` }"
          />
        </div>

        <!-- 控制按钮 -->
        <div v-show="!isCollapsed" class="controls">
          <button
            class="ctrl-button play-pause"
            :aria-label="musicPlayer.isPlaying ? '暂停' : '播放'"
            @click="handleToggle"
          >
            <svg v-if="musicPlayer.isPlaying" viewBox="0 0 24 24" class="icon">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
            <svg v-else viewBox="0 0 24 24" class="icon">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <button class="ctrl-button collapse" aria-label="收起播放器" @click="handleCollapse">
            <svg viewBox="0 0 24 24" class="icon">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button class="ctrl-button close" aria-label="关闭播放器" @click="handleClose">
            <svg viewBox="0 0 24 24" class="icon">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.floating-player {
  position: fixed;
  left: 50%;
  bottom: 1.75rem;
  transform: translateX(-50%);
  z-index: 9000;
  pointer-events: none;
  transition:
    left 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    right 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.floating-player.is-collapsed {
  left: auto;
  right: 1.25rem;
  transform: none;
}

.player-card {
  position: relative;
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 0.75rem 1.25rem 0.75rem 0.75rem;
  min-width: 460px;
  max-width: 92vw;
  border-radius: 999px;
  transition:
    min-width 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    gap 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(
    135deg,
    rgba(20, 28, 56, 0.78) 0%,
    rgba(40, 24, 72, 0.78) 50%,
    rgba(18, 32, 60, 0.78) 100%
  );
  border: 1px solid rgba(180, 210, 255, 0.18);
  box-shadow:
    0 18px 48px -12px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 0 40px rgba(120, 160, 255, 0.18);
  backdrop-filter: blur(22px) saturate(160%);
  -webkit-backdrop-filter: blur(22px) saturate(160%);
  color: rgba(240, 247, 255, 0.95);
  overflow: visible;
}

.player-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    135deg,
    rgba(180, 220, 255, 0.45),
    rgba(255, 255, 255, 0.05) 40%,
    rgba(220, 180, 255, 0.35) 80%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.85;
}

.player-card.is-collapsed {
  min-width: 0;
  width: 72px;
  height: 72px;
  padding: 6px;
  gap: 0;
  border-radius: 50%;
  justify-content: center;
}

/* --- 光环涟漪 --- */
.aura {
  position: absolute;
  left: 30px;
  top: 50%;
  width: 64px;
  height: 64px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: left 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.floating-player.is-collapsed .aura {
  left: 50%;
}
.aura-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(170, 210, 255, 0.5);
  opacity: 0;
}
.aura.is-playing .aura-ring {
  animation: ringPulse 3.2s ease-out infinite;
}
.aura.is-playing .aura-ring-2 { animation-delay: 1s; }
.aura.is-playing .aura-ring-3 { animation-delay: 2s; }

@keyframes ringPulse {
  0%   { transform: scale(0.6); opacity: 0.7; }
  70%  { opacity: 0.15; }
  100% { transform: scale(2.4); opacity: 0; }
}

/* --- 黑胶唱片 --- */
.vinyl-wrapper {
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  cursor: pointer;
}

.vinyl {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, #1a1a22 0%, #050507 70%, #000 100%);
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 0 22px rgba(120, 160, 255, 0.25);
  animation: vinylSpin 8s linear infinite;
  animation-play-state: paused;
  transition: box-shadow 0.4s ease;
}

.vinyl.is-playing {
  animation-play-state: running;
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 0 32px rgba(160, 200, 255, 0.45);
}

.vinyl-grooves {
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background:
    repeating-radial-gradient(
      circle at 50% 50%,
      rgba(255, 255, 255, 0.04) 0px,
      rgba(255, 255, 255, 0.04) 1px,
      transparent 1px,
      transparent 3px
    );
}

.vinyl-cover {
  position: absolute;
  inset: 14px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-color: rgba(100, 130, 200, 0.4);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.15) inset,
    0 0 12px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.vinyl-note {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 0 8px rgba(180, 210, 255, 0.6);
}

.vinyl-center {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, #fff 0%, #888 60%, #222 100%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);
}

.vinyl-arm {
  position: absolute;
  top: -6px;
  right: -8px;
  width: 28px;
  height: 28px;
  transform-origin: top right;
  transform: rotate(15deg);
  transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
}
.vinyl-arm.is-playing {
  transform: rotate(-25deg);
}
.vinyl-arm::before {
  content: '';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 22px;
  height: 2px;
  background: linear-gradient(90deg, rgba(220, 230, 255, 0.9), rgba(180, 200, 240, 0.6));
  border-radius: 2px;
  transform-origin: right;
  transform: rotate(45deg);
  box-shadow: 0 0 4px rgba(180, 210, 255, 0.6);
}
.vinyl-arm::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle, #f4f6ff 0%, #8da0c8 100%);
  box-shadow: 0 0 6px rgba(180, 210, 255, 0.8);
}

@keyframes vinylSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* --- 信息与进度 --- */
.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.now-label {
  font-size: 0.6rem;
  letter-spacing: 0.18em;
  color: rgba(180, 210, 255, 0.7);
  padding: 0.15rem 0.45rem;
  border: 1px solid rgba(180, 210, 255, 0.3);
  border-radius: 999px;
  flex-shrink: 0;
}

.title {
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: linear-gradient(120deg, #ffffff 0%, #cfe2ff 60%, #e7d1ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.time {
  font-size: 0.7rem;
  color: rgba(220, 230, 255, 0.6);
  font-variant-numeric: tabular-nums;
  min-width: 2.5rem;
  text-align: center;
}

.progress-track-wrap {
  position: relative;
  flex: 1;
  height: 18px;
  display: flex;
  align-items: center;
}

.progress-track {
  position: relative;
  width: 100%;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: visible;
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #7cc4ff 0%, #b48cff 100%);
  box-shadow: 0 0 8px rgba(124, 196, 255, 0.6);
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 10px rgba(180, 210, 255, 0.8);
  opacity: 0;
  transition: opacity 0.2s ease;
}
.progress-track-wrap:hover .progress-thumb {
  opacity: 1;
}

.progress-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  margin: 0;
}

/* --- 音波 --- */
.wave {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 24px;
  flex-shrink: 0;
}

.wave-bar {
  display: block;
  width: 2.5px;
  height: 6px;
  border-radius: 2px;
  background: linear-gradient(180deg, #b48cff 0%, #7cc4ff 100%);
  box-shadow: 0 0 6px rgba(124, 196, 255, 0.5);
}

.wave.is-playing .wave-bar {
  animation: waveJump 1s ease-in-out infinite;
}

@keyframes waveJump {
  0%, 100% { height: 4px; }
  50%      { height: 18px; }
}

/* --- 控制按钮 --- */
.controls {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.ctrl-button {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(240, 247, 255, 0.95);
  cursor: pointer;
  transition: all 0.25s ease;
  padding: 0;
}

.ctrl-button:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(120, 160, 255, 0.35);
}

.ctrl-button.play-pause {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(124, 196, 255, 0.22), rgba(180, 140, 255, 0.22));
  border-color: rgba(180, 210, 255, 0.4);
}

.ctrl-button.play-pause:hover {
  background: linear-gradient(135deg, rgba(124, 196, 255, 0.38), rgba(180, 140, 255, 0.38));
}

.ctrl-button .icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

/* --- 进出动画 --- */
.player-rise-enter-active {
  transition:
    opacity 0.6s ease,
    transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.player-rise-leave-active {
  transition:
    opacity 0.45s ease,
    transform 0.45s ease;
}
.player-rise-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(120%) scale(0.92);
}
.player-rise-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(60%) scale(0.95);
}

@media (max-width: 540px) {
  .floating-player.is-collapsed {
    right: 0.75rem;
    bottom: 1.25rem;
  }

  .player-card:not(.is-collapsed) {
    min-width: 0;
    width: 92vw;
    padding: 0.6rem 0.8rem 0.6rem 0.6rem;
    gap: 0.75rem;
  }

  .player-card.is-collapsed {
    width: 60px;
    height: 60px;
    padding: 5px;
  }

  .now-label {
    display: none;
  }
  .wave {
    display: none;
  }
  .vinyl-wrapper {
    width: 48px;
    height: 48px;
  }
  .player-card.is-collapsed .vinyl-wrapper {
    width: 50px;
    height: 50px;
  }
  .aura {
    left: 24px;
    width: 48px;
    height: 48px;
  }
  .floating-player.is-collapsed .aura {
    left: 50%;
    width: 56px;
    height: 56px;
  }
}
</style>
