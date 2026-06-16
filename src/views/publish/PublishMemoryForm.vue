<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { Memory, MemoryType, ParticleTheme } from '@/types/memory'
import { ApiError } from '@/api/client'
import {
  createPublishMemory,
  fetchPublishMemories,
  fetchPublishMemoryById,
  updatePublishMemory,
  uploadPublishMedia,
} from '@/api/memories'
import MemoryDetail from '@/components/MemoryDetail.vue'
import MemoryPlanet from '@/components/MemoryPlanet.vue'

interface FormState {
  type: MemoryType
  title: string
  date: string
  color: string
  theta: number
  phi: number
  orbitRadius: number
  text: string
  imageUrl: string
  imageUrls: string[]
  audioUrl: string
  videoUrl: string
  location: string
  theme: ParticleTheme
}

const MAX_IMAGE_COUNT = 5

const route = useRoute()
const router = useRouter()

const memoryTypeOptions: { value: MemoryType; label: string }[] = [
  { value: 'photo', label: '照片' },
  { value: 'date', label: '纪念日' },
  { value: 'chat', label: '对话' },
  { value: 'location', label: '地点' },
  { value: 'music', label: '音乐' },
]

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

const DEFAULT_COLOR_PALETTE = ['#42A5F5', '#EF5350', '#26C6DA', '#EC407A', '#66BB6A', '#5C6BC0', '#FFB300', '#AB47BC']

const randomColor = () => {
  const base = DEFAULT_COLOR_PALETTE[Math.floor(Math.random() * DEFAULT_COLOR_PALETTE.length)]
  const r = parseInt(base.slice(1, 3), 16)
  const g = parseInt(base.slice(3, 5), 16)
  const b = parseInt(base.slice(5, 7), 16)
  const vary = () => Math.round((Math.random() - 0.5) * 50)
  const clamp = (n: number) => Math.max(0, Math.min(255, n))
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(clamp(r + vary()))}${toHex(clamp(g + vary()))}${toHex(clamp(b + vary()))}`
}

const form = reactive<FormState>({
  type: 'photo',
  title: '',
  date: '',
  color: randomColor(),
  theta: 1.8,
  phi: 1.2,
  orbitRadius: 1.08,
  text: '',
  imageUrl: '',
  imageUrls: [],
  audioUrl: '',
  videoUrl: '',
  location: '',
  theme: 'default',
})

const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
let successTimer: ReturnType<typeof setTimeout> | null = null

const showSuccess = (msg: string, duration = 4000) => {
  if (successTimer) clearTimeout(successTimer)
  successMessage.value = msg
  successTimer = setTimeout(() => {
    successMessage.value = ''
    successTimer = null
  }, duration)
}

const clearSuccess = () => {
  if (successTimer) clearTimeout(successTimer)
  successMessage.value = ''
  successTimer = null
}

const isUploadingImage = ref(false)
const isUploadingAudio = ref(false)
const isUploadingVideo = ref(false)
const previewErrorMessage = ref('')
const previewCatalog = ref<Memory[]>([])
const previewDetailMemory = ref<Memory | null>(null)

const isEditMode = computed(() => typeof route.params.id === 'string' && route.params.id.length > 0)
const currentId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const previewFormMemory = computed<Memory>(() => {
  const imageUrls = getSanitizedImageUrls()
  const fallbackImageUrl = form.imageUrl.trim()
  const resolvedImageUrl = imageUrls[0] ?? fallbackImageUrl
  return {
    id: currentId.value || '__preview_draft__',
    type: form.type,
    title: form.title || '未命名记忆点',
    date: form.date || '待填写日期',
    color: form.color || '#6AA0FF',
    orbitRadius: Number(form.orbitRadius) || 1.08,
    position: {
      theta: Number(form.theta) || 0,
      phi: Number(form.phi) || 0,
    },
    content: {
      text: form.text || undefined,
      imageUrl: resolvedImageUrl || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      audioUrl: form.audioUrl || undefined,
      videoUrl: form.videoUrl || undefined,
      location: form.location || undefined,
      theme: form.theme || undefined,
    },
  }
})
const previewPlanetMemories = computed<Memory[]>(() => {
  const catalogWithoutCurrent = previewCatalog.value.filter((item) => item.id !== previewFormMemory.value.id)
  return [...catalogWithoutCurrent, previewFormMemory.value]
})

const getSanitizedImageUrls = (): string[] => {
  const urls = form.imageUrls.map((url) => url.trim()).filter((url) => url.length > 0)
  return urls.slice(0, MAX_IMAGE_COUNT)
}

const applyMemoryToForm = (memory: Memory) => {
  form.type = memory.type
  form.title = memory.title
  form.date = memory.date
  form.color = memory.color
  form.theta = memory.position.theta
  form.phi = memory.position.phi
  form.orbitRadius = memory.orbitRadius
  form.text = memory.content.text ?? ''
  const loadedImageUrls = memory.content.imageUrls?.filter((url) => url.trim().length > 0).slice(0, MAX_IMAGE_COUNT) ?? []
  form.imageUrls = loadedImageUrls.length > 0 ? loadedImageUrls : (memory.content.imageUrl ? [memory.content.imageUrl] : [])
  form.imageUrl = memory.content.imageUrl ?? loadedImageUrls[0] ?? ''
  form.audioUrl = memory.content.audioUrl ?? ''
  form.videoUrl = memory.content.videoUrl ?? ''
  form.location = memory.content.location ?? ''
  form.theme = memory.content.theme ?? 'default'
}

const buildPayload = (): Omit<Memory, 'id'> => {
  const imageUrls = getSanitizedImageUrls()
  const fallbackImageUrl = form.imageUrl.trim()
  const resolvedImageUrl = imageUrls[0] ?? fallbackImageUrl
  return {
    type: form.type,
    title: form.title,
    date: form.date,
    color: form.color,
    orbitRadius: Number(form.orbitRadius),
    position: {
      theta: Number(form.theta),
      phi: Number(form.phi),
    },
    content: {
      text: form.text || undefined,
      imageUrl: resolvedImageUrl || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      audioUrl: form.audioUrl || undefined,
      videoUrl: form.videoUrl || undefined,
      location: form.location || undefined,
      theme: form.theme || undefined,
    },
  }
}

const loadPreviewCatalog = async () => {
  previewErrorMessage.value = ''
  try {
    previewCatalog.value = await fetchPublishMemories()
  } catch (error) {
    if (error instanceof Error) {
      previewErrorMessage.value = error.message
      return
    }
    previewErrorMessage.value = '预览列表加载失败'
  }
}

const refillAutoPosition = () => {
  form.theta = Number((Math.random() * Math.PI * 2).toFixed(4))
  form.phi = Number((Math.random() * Math.PI).toFixed(4))
  form.orbitRadius = Number((1.05 + Math.random() * 0.1).toFixed(4))
}

const uploadFile = async (file: File, target: 'audio' | 'video') => {
  errorMessage.value = ''
  clearSuccess()
  if (target === 'audio') {
    isUploadingAudio.value = true
  } else {
    isUploadingVideo.value = true
  }
  try {
    const url = await uploadPublishMedia(file)
    if (target === 'audio') {
      form.audioUrl = url
    } else {
      form.videoUrl = url
    }
    const targetLabel = target === 'audio' ? '音频' : '视频'
    showSuccess(`${targetLabel}上传成功，链接已自动填入表单`)
  } catch (error) {
    clearSuccess()
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '上传失败'
    }
  } finally {
    if (target === 'audio') {
      isUploadingAudio.value = false
    } else {
      isUploadingVideo.value = false
    }
  }
}

const handleUploadImage = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  if (files.length === 0) return

  errorMessage.value = ''
  clearSuccess()
  const existing = getSanitizedImageUrls()
  const remain = MAX_IMAGE_COUNT - existing.length
  if (remain <= 0) {
    errorMessage.value = `最多只能上传 ${MAX_IMAGE_COUNT} 张图片`
    input.value = ''
    return
  }

  const selected = files.slice(0, remain)
  isUploadingImage.value = true
  try {
    const uploaded: string[] = []
    for (const file of selected) {
      const url = await uploadPublishMedia(file)
      if (!existing.includes(url) && !uploaded.includes(url)) {
        uploaded.push(url)
      }
    }
    form.imageUrls = [...existing, ...uploaded].slice(0, MAX_IMAGE_COUNT)
    form.imageUrl = form.imageUrls[0] ?? ''
    let msg = ''
    if (uploaded.length > 0) {
      msg = `图片上传成功，已新增 ${uploaded.length} 张`
    } else {
      msg = '图片已存在，未新增'
    }
    if (files.length > selected.length) {
      msg += `（最多保留 ${MAX_IMAGE_COUNT} 张）`
    }
    showSuccess(msg)
  } catch (error) {
    clearSuccess()
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '图片上传失败'
    }
  } finally {
    isUploadingImage.value = false
    input.value = ''
  }
}

const handleUploadAudio = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await uploadFile(file, 'audio')
}

const handleUploadVideo = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await uploadFile(file, 'video')
}

const removeImageAt = (index: number) => {
  if (index < 0 || index >= form.imageUrls.length) return
  form.imageUrls = form.imageUrls.filter((_, idx) => idx !== index)
  form.imageUrl = form.imageUrls[0] ?? ''
}

const clearAudio = () => {
  form.audioUrl = ''
}

const clearVideo = () => {
  form.videoUrl = ''
}

const handleSubmit = async () => {
  errorMessage.value = ''
  if (!form.title.trim()) {
    errorMessage.value = '请填写标题'
    return
  }
  if (!form.date.trim()) {
    errorMessage.value = '请填写日期'
    return
  }

  submitting.value = true
  try {
    if (isEditMode.value) {
      await updatePublishMemory(currentId.value, buildPayload())
    } else {
      await createPublishMemory(buildPayload())
    }
    await router.push({ name: 'PublishMemoryList' })
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      errorMessage.value = '保存失败，请稍后重试'
      return
    }
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '保存失败'
    }
  } finally {
    submitting.value = false
  }
}

const handlePreviewNodeClick = (memory: Memory) => {
  previewDetailMemory.value = memory
}

const openCurrentDetailPreview = () => {
  previewDetailMemory.value = previewFormMemory.value
}

onMounted(async () => {
  await loadPreviewCatalog()

  if (!isEditMode.value) {
    refillAutoPosition()
    return
  }
  loading.value = true
  try {
    const memory = await fetchPublishMemoryById(currentId.value)
    applyMemoryToForm(memory)
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '加载失败'
    }
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (successTimer) clearTimeout(successTimer)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16 text-[#63708c] text-sm">
      <svg class="w-5 h-5 mr-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      加载中...
    </div>

    <!-- Main layout: Form + Preview -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-4 xl:gap-6 items-start">
      <!-- ============ Form Card ============ -->
      <form class="bg-white border border-[#d5ddee] rounded-xl p-5 md:p-6 flex flex-col gap-5 shadow-sm" @submit.prevent="handleSubmit">
        <!-- Section: Basic Info -->
        <div class="flex flex-col gap-4">
          <h3 class="text-sm font-semibold text-[#2a3a63] uppercase tracking-wide m-0 pb-2 border-b border-[#ecf0f8]">基本信息</h3>

          <label class="flex flex-col gap-1.5 text-sm font-medium text-[#4a597f]">
            <span>标题 <span class="text-[#b72929]">*</span></span>
            <input
              v-model.trim="form.title"
              required
              class="border border-[#ccd5e8] rounded-lg px-3.5 py-2.5 text-base md:text-sm text-[#1d2433] font-normal placeholder:text-[#b0bdd4] focus:outline-none focus:border-[#243b76] focus:ring-1 focus:ring-[#243b76]/20 transition-colors"
            />
          </label>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="flex flex-col gap-1.5 text-sm font-medium text-[#4a597f]">
              类型
              <select
                v-model="form.type"
                class="border border-[#ccd5e8] rounded-lg px-3.5 py-2.5 text-base md:text-sm text-[#1d2433] font-normal bg-white focus:outline-none focus:border-[#243b76] focus:ring-1 focus:ring-[#243b76]/20 transition-colors"
              >
                <option
                  v-for="item in memoryTypeOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </option>
              </select>
            </label>

            <label class="flex flex-col gap-1.5 text-sm font-medium text-[#4a597f]">
              <span>日期 <span class="text-[#b72929]">*</span></span>
              <input
                v-model.trim="form.date"
                required
                placeholder="例如 2026.05.09"
                class="border border-[#ccd5e8] rounded-lg px-3.5 py-2.5 text-base md:text-sm text-[#1d2433] font-normal placeholder:text-[#b0bdd4] focus:outline-none focus:border-[#243b76] focus:ring-1 focus:ring-[#243b76]/20 transition-colors"
              />
            </label>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="flex flex-col gap-1.5 text-sm font-medium text-[#4a597f]">
              颜色
              <div class="flex items-center gap-2.5">
                <input
                  v-model.trim="form.color"
                  type="color"
                  class="w-10 h-10 rounded-lg border border-[#ccd5e8] cursor-pointer p-0.5 bg-white"
                />
                <input
                  v-model.trim="form.color"
                  class="flex-1 border border-[#ccd5e8] rounded-lg px-3.5 py-2.5 text-base md:text-sm text-[#1d2433] font-mono font-normal focus:outline-none focus:border-[#243b76] focus:ring-1 focus:ring-[#243b76]/20 transition-colors"
                />
              </div>
            </label>

            <label class="flex flex-col gap-1.5 text-sm font-medium text-[#4a597f]">
              粒子主题
              <select
                v-model="form.theme"
                class="border border-[#ccd5e8] rounded-lg px-3.5 py-2.5 text-base md:text-sm text-[#1d2433] font-normal bg-white focus:outline-none focus:border-[#243b76] focus:ring-1 focus:ring-[#243b76]/20 transition-colors"
              >
                <option
                  v-for="item in particleThemeOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </option>
              </select>
            </label>
          </div>
        </div>

        <!-- Section: Content -->
        <div class="flex flex-col gap-4">
          <h3 class="text-sm font-semibold text-[#2a3a63] uppercase tracking-wide m-0 pb-2 border-b border-[#ecf0f8]">内容</h3>

          <label class="flex flex-col gap-1.5 text-sm font-medium text-[#4a597f]">
            文案
            <textarea
              v-model.trim="form.text"
              rows="4"
              class="border border-[#ccd5e8] rounded-lg px-3.5 py-2.5 text-base md:text-sm text-[#1d2433] font-normal resize-y placeholder:text-[#b0bdd4] focus:outline-none focus:border-[#243b76] focus:ring-1 focus:ring-[#243b76]/20 transition-colors"
            ></textarea>
          </label>

          <label class="flex flex-col gap-1.5 text-sm font-medium text-[#4a597f]">
            地点
            <input
              v-model.trim="form.location"
              class="border border-[#ccd5e8] rounded-lg px-3.5 py-2.5 text-base md:text-sm text-[#1d2433] font-normal placeholder:text-[#b0bdd4] focus:outline-none focus:border-[#243b76] focus:ring-1 focus:ring-[#243b76]/20 transition-colors"
            />
          </label>
        </div>

        <!-- Section: Media Upload -->
        <div class="flex flex-col gap-4">
          <h3 class="text-sm font-semibold text-[#2a3a63] uppercase tracking-wide m-0 pb-2 border-b border-[#ecf0f8]">媒体上传</h3>

          <!-- Images -->
          <div class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-[#4a597f]">上传图片（最多 {{ MAX_IMAGE_COUNT }} 张，可多选）</span>
            <div class="flex items-center gap-3">
              <label class="inline-flex items-center px-4 py-2.5 bg-[#243b76] text-white text-sm font-medium rounded-lg hover:bg-[#1a2d5e] transition-colors cursor-pointer shadow-sm" tabindex="0">
                <input type="file" accept="image/*" multiple class="sr-only" @change="handleUploadImage" />
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                选择图片
              </label>
              <span class="text-sm text-[#5d6989]">
                {{ getSanitizedImageUrls().length > 0 ? `已上传 ${getSanitizedImageUrls().length} 张` : '未选择任何文件' }}
              </span>
            </div>
          </div>

          <!-- Audio -->
          <div class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-[#4a597f]">上传音频</span>
            <div class="flex items-center gap-3">
              <label class="inline-flex items-center px-4 py-2.5 bg-[#243b76] text-white text-sm font-medium rounded-lg hover:bg-[#1a2d5e] transition-colors cursor-pointer shadow-sm" tabindex="0">
                <input type="file" accept="audio/mpeg,audio/mp3" class="sr-only" @change="handleUploadAudio" />
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                选择音频
              </label>
              <span class="text-sm text-[#5d6989]">{{ form.audioUrl ? '已上传音频' : '未选择任何文件' }}</span>
            </div>
          </div>

          <!-- Video -->
          <div class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-[#4a597f]">上传视频</span>
            <div class="flex items-center gap-3">
              <label class="inline-flex items-center px-4 py-2.5 bg-[#243b76] text-white text-sm font-medium rounded-lg hover:bg-[#1a2d5e] transition-colors cursor-pointer shadow-sm" tabindex="0">
                <input type="file" accept="video/*" class="sr-only" @change="handleUploadVideo" />
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.106.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                选择视频
              </label>
              <span class="text-sm text-[#5d6989]">{{ form.videoUrl ? '已上传视频' : '未选择任何文件' }}</span>
            </div>
          </div>
        </div>

        <!-- Section: Position (Advanced) -->
        <fieldset class="border border-dashed border-[#b9c5df] rounded-xl p-4 md:p-5 m-0 flex flex-col gap-4">
          <legend class="px-2 text-sm font-semibold text-[#4a597f]">星球位置高级设置</legend>

          <div class="grid grid-cols-3 gap-3">
            <label class="flex flex-col gap-1 text-xs font-medium text-[#5a6377]">
              theta
              <input
                v-model.number="form.theta"
                type="number"
                step="0.0001"
                class="border border-[#ccd5e8] rounded-lg px-3 py-2 text-base md:text-sm text-[#1d2433] font-mono font-normal focus:outline-none focus:border-[#243b76] focus:ring-1 focus:ring-[#243b76]/20 transition-colors"
              />
            </label>
            <label class="flex flex-col gap-1 text-xs font-medium text-[#5a6377]">
              phi
              <input
                v-model.number="form.phi"
                type="number"
                step="0.0001"
                class="border border-[#ccd5e8] rounded-lg px-3 py-2 text-base md:text-sm text-[#1d2433] font-mono font-normal focus:outline-none focus:border-[#243b76] focus:ring-1 focus:ring-[#243b76]/20 transition-colors"
              />
            </label>
            <label class="flex flex-col gap-1 text-xs font-medium text-[#5a6377]">
              orbitRadius
              <input
                v-model.number="form.orbitRadius"
                type="number"
                step="0.0001"
                class="border border-[#ccd5e8] rounded-lg px-3 py-2 text-base md:text-sm text-[#1d2433] font-mono font-normal focus:outline-none focus:border-[#243b76] focus:ring-1 focus:ring-[#243b76]/20 transition-colors"
              />
            </label>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#4a597f] bg-white border border-[#ccd5e8] rounded-lg hover:bg-[#f3f5f9] transition-colors cursor-pointer self-start"
            @click="refillAutoPosition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重新自动分布
          </button>
        </fieldset>

        <!-- Feedback Messages -->
        <div
          v-if="errorMessage"
          class="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] text-[#b72929] text-sm rounded-lg"
        >
          {{ errorMessage }}
        </div>
        <div
          v-if="isUploadingImage || isUploadingAudio || isUploadingVideo"
          class="flex items-center gap-2 px-4 py-3 bg-[#f8faff] border border-[#d8dfee] text-[#5d6989] text-sm rounded-lg"
        >
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ isUploadingImage ? '图片上传中...' : '' }}
          {{ isUploadingAudio ? '音频上传中...' : '' }}
          {{ isUploadingVideo ? '视频上传中...' : '' }}
        </div>

        <!-- Uploaded Media Previews -->
        <div v-if="form.imageUrl || form.audioUrl || form.videoUrl || getSanitizedImageUrls().length > 0" class="flex flex-col gap-4 p-4 bg-[#f8faff] border border-[#d8dfee] rounded-xl">
          <!-- Image previews -->
          <div v-if="getSanitizedImageUrls().length > 0" class="flex flex-col gap-3">
            <p class="text-sm font-medium text-[#4a597f] m-0">图片（{{ getSanitizedImageUrls().length }} 张）</p>
            <div class="flex flex-col gap-2">
              <div
                v-for="(url, index) in getSanitizedImageUrls()"
                :key="`${url}-${index}`"
                class="flex items-center gap-3 bg-white rounded-lg border border-[#e5eaf4] p-2.5"
              >
                <img class="w-12 h-12 rounded-lg object-cover border border-[#d4dbeb] flex-shrink-0" :src="url" alt="" />
                <span class="flex-1 text-xs text-[#5d6989] truncate font-mono">{{ url }}</span>
                <button
                  type="button"
                  class="px-3 py-1.5 text-xs font-medium text-[#c43e3e] bg-white border border-[#e5b8b8] rounded-md hover:bg-[#fef2f2] transition-colors cursor-pointer flex-shrink-0"
                  @click="removeImageAt(index)"
                >删除</button>
              </div>
            </div>
          </div>

          <!-- Audio preview -->
          <div v-if="form.audioUrl" class="flex flex-col gap-2">
            <p class="text-sm font-medium text-[#4a597f] m-0">音频</p>
            <div class="flex items-center gap-3 bg-white rounded-lg border border-[#e5eaf4] p-3">
              <audio :src="form.audioUrl" controls class="max-w-[320px] h-9"></audio>
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-medium text-[#c43e3e] bg-white border border-[#e5b8b8] rounded-md hover:bg-[#fef2f2] transition-colors cursor-pointer flex-shrink-0"
                @click="clearAudio"
              >删除</button>
            </div>
          </div>

          <!-- Video preview -->
          <div v-if="form.videoUrl" class="flex flex-col gap-2">
            <p class="text-sm font-medium text-[#4a597f] m-0">视频</p>
            <div class="flex items-center gap-3 bg-white rounded-lg border border-[#e5eaf4] p-3">
              <video :src="form.videoUrl" controls class="max-w-full max-h-60 rounded-lg"></video>
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-medium text-[#c43e3e] bg-white border border-[#e5b8b8] rounded-md hover:bg-[#fef2f2] transition-colors cursor-pointer flex-shrink-0"
                @click="clearVideo"
              >删除</button>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between pt-3 border-t border-[#ecf0f8] mt-2">
          <RouterLink
            :to="{ name: 'PublishMemoryList' }"
            class="px-4 py-2 text-sm font-medium text-[#6b7280] bg-white border border-[#d1d5db] rounded-lg hover:bg-[#f9fafb] transition-colors no-underline"
          >
            取消
          </RouterLink>
          <button
            type="submit"
            :disabled="submitting"
            class="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-[#243b76] border border-[#243b76] rounded-lg hover:bg-[#1a2d5e] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ submitting ? '保存中...' : isEditMode ? '保存修改' : '确定新增' }}
          </button>
        </div>
      </form>

      <!-- ============ Preview Panel ============ -->
      <aside class="bg-white border border-[#d8e0f1] rounded-xl p-4 md:p-5 flex flex-col gap-4 shadow-sm lg:sticky lg:top-4">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-sm font-semibold text-[#2a3a63] m-0">预览面板</h3>
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-medium text-white bg-[#243b76] rounded-lg hover:bg-[#1a2d5e] transition-colors cursor-pointer"
            @click="openCurrentDetailPreview"
          >
            预览详情
          </button>
        </div>

        <p class="text-xs text-[#5d6989] m-0">点击星球节点可打开对应详情。</p>

        <div
          v-if="previewErrorMessage"
          class="px-3 py-2 bg-[#fef2f2] border border-[#fecaca] text-[#b72929] text-xs rounded-lg"
        >
          {{ previewErrorMessage }}
        </div>

        <div class="relative h-[400px] rounded-xl overflow-hidden border border-[#d5deef] bg-[#020611]">
          <MemoryPlanet
            phase="exploring"
            :memories="previewPlanetMemories"
            :active-memory="previewDetailMemory"
            :skip-forming="true"
            @node-click="handlePreviewNodeClick"
          />
        </div>
      </aside>
    </div>

    <!-- Memory Detail Overlay -->
    <MemoryDetail
      v-if="previewDetailMemory"
      :memory="previewDetailMemory"
      @close="previewDetailMemory = null"
    />

    <!-- Success Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="successMessage"
          class="fixed z-[9999] flex items-center gap-2.5 px-5 py-3 bg-white border border-[#d1f0d8] rounded-xl shadow-lg"
          style="top: 24px; left: 50%; transform: translateX(-50%);"
        >
          <span class="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center flex-shrink-0">
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span class="text-base md:text-sm text-[#1d2433]">{{ successMessage }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style>
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.25s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px) translateX(-50%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) translateX(-50%);
}
</style>
