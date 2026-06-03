import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMusicPlayerStore = defineStore('musicPlayer', () => {
  let audio: HTMLAudioElement | null = null

  const isPlaying = ref(false)
  const isVisible = ref(false)
  const currentTitle = ref('')
  const currentUrl = ref('')
  const currentCover = ref<string | undefined>(undefined)
  const currentTime = ref(0)
  const duration = ref(0)

  const progress = computed(() =>
    duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
  )

  const ensureAudio = () => {
    if (audio) return audio
    audio = new Audio()
    audio.preload = 'metadata'

    audio.addEventListener('play', () => {
      isPlaying.value = true
    })
    audio.addEventListener('pause', () => {
      isPlaying.value = false
    })
    audio.addEventListener('ended', () => {
      isPlaying.value = false
      currentTime.value = 0
    })
    audio.addEventListener('timeupdate', () => {
      if (audio) currentTime.value = audio.currentTime
    })
    audio.addEventListener('durationchange', () => {
      if (audio && !Number.isNaN(audio.duration)) {
        duration.value = audio.duration
      }
    })
    audio.addEventListener('loadedmetadata', () => {
      if (audio && !Number.isNaN(audio.duration)) {
        duration.value = audio.duration
      }
    })
    return audio
  }

  const play = async (url: string, title: string, cover?: string) => {
    const el = ensureAudio()
    isVisible.value = true

    if (currentUrl.value !== url) {
      currentUrl.value = url
      currentTitle.value = title
      currentCover.value = cover
      el.src = url
      currentTime.value = 0
      duration.value = 0
    }

    try {
      await el.play()
    } catch (err) {
      console.warn('音频播放失败', err)
    }
  }

  const pause = () => {
    audio?.pause()
  }

  const resume = async () => {
    if (!audio || !currentUrl.value) return
    try {
      await audio.play()
    } catch (err) {
      console.warn('音频恢复播放失败', err)
    }
  }

  const toggle = async () => {
    if (!audio) return
    if (isPlaying.value) {
      pause()
    } else {
      await resume()
    }
  }

  const seek = (time: number) => {
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(time, duration.value || 0))
    currentTime.value = audio.currentTime
  }

  const close = () => {
    if (audio) {
      audio.pause()
      audio.src = ''
    }
    isPlaying.value = false
    isVisible.value = false
    currentUrl.value = ''
    currentTitle.value = ''
    currentCover.value = undefined
    currentTime.value = 0
    duration.value = 0
  }

  const isCurrentTrack = (url: string) => currentUrl.value === url

  return {
    isPlaying,
    isVisible,
    currentTitle,
    currentUrl,
    currentCover,
    currentTime,
    duration,
    progress,
    play,
    pause,
    resume,
    toggle,
    seek,
    close,
    isCurrentTrack
  }
})
