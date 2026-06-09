<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
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
  successMessage.value = ''
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
    successMessage.value = `${targetLabel}上传成功，链接已自动填入表单`
  } catch (error) {
    successMessage.value = ''
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
  successMessage.value = ''
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
    if (uploaded.length > 0) {
      successMessage.value = `图片上传成功，已新增 ${uploaded.length} 张`
    } else {
      successMessage.value = '图片已存在，未新增'
    }
    if (files.length > selected.length) {
      successMessage.value += `（最多保留 ${MAX_IMAGE_COUNT} 张）`
    }
  } catch (error) {
    successMessage.value = ''
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
</script>

<template>
  <section class="panel">
    <p v-if="loading" class="hint">加载中...</p>
    <div v-else class="layout">
      <form class="form" @submit.prevent="handleSubmit">
        <label>
          <span class="field-label">标题<span class="required">*</span></span>
          <input v-model.trim="form.title" required />
        </label>

        <div class="row">
          <label>
            类型
            <select v-model="form.type">
              <option
                v-for="item in memoryTypeOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </option>
            </select>
          </label>

          <label>
            <span class="field-label">日期<span class="required">*</span></span>
            <input
              v-model.trim="form.date"
              required
              placeholder="例如 2025-05-20"
            />
          </label>
        </div>

        <div class="row">
          <label>
            颜色
            <input v-model.trim="form.color" type="color" />
          </label>
          <label>
            粒子主题
            <select v-model="form.theme">
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

        <label>
          文案
          <textarea v-model.trim="form.text" rows="4"></textarea>
        </label>

        <label>
          地点
          <input v-model.trim="form.location" />
        </label>

        <div class="upload-row">
          <label class="upload-field">
            上传图片（最多 5 张，可多选）
            <input type="file" accept="image/*" multiple @change="handleUploadImage" />
          </label>
          <label class="upload-field">
            上传音频
            <input type="file" accept="audio/mpeg,audio/mp3" @change="handleUploadAudio" />
          </label>
          <label class="upload-field">
            上传视频
            <input type="file" accept="video/*" @change="handleUploadVideo" />
          </label>
        </div>

        <fieldset class="advanced">
          <legend>星球位置高级设置</legend>
          <div class="row">
            <label>
              theta
              <input v-model.number="form.theta" type="number" step="0.0001" />
            </label>
            <label>
              phi
              <input v-model.number="form.phi" type="number" step="0.0001" />
            </label>
            <label>
              orbitRadius
              <input v-model.number="form.orbitRadius" type="number" step="0.0001" />
            </label>
          </div>
          <button type="button" @click="refillAutoPosition">重新自动分布</button>
        </fieldset>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success">{{ successMessage }}</p>
        <p class="hint" v-if="isUploadingImage || isUploadingAudio || isUploadingVideo">
          {{ isUploadingImage ? '图片上传中...' : '' }}
          {{ isUploadingAudio ? '音频上传中...' : '' }}
          {{ isUploadingVideo ? '视频上传中...' : '' }}
        </p>
        <div class="upload-result" v-if="form.imageUrl || form.audioUrl || form.videoUrl || getSanitizedImageUrls().length > 0">
          <div v-if="getSanitizedImageUrls().length > 0" class="media-block">
            <p class="hint">图片（{{ getSanitizedImageUrls().length }} 张）</p>
            <div class="media-list">
              <div v-for="(url, index) in getSanitizedImageUrls()" :key="`${url}-${index}`" class="media-item">
                <span class="hint media-url">{{ url }}</span>
                <button type="button" class="danger-button" @click="removeImageAt(index)">删除</button>
              </div>
            </div>
          </div>
          <div v-if="form.audioUrl" class="media-block">
            <p class="hint">音频链接：{{ form.audioUrl }}</p>
            <button type="button" class="danger-button" @click="clearAudio">删除音频</button>
          </div>
          <div v-if="form.videoUrl" class="media-block">
            <p class="hint">视频链接：{{ form.videoUrl }}</p>
            <button type="button" class="danger-button" @click="clearVideo">删除视频</button>
          </div>
        </div>

        <div class="footer">
          <RouterLink :to="{ name: 'PublishMemoryList' }">取消</RouterLink>
          <button type="submit" :disabled="submitting">
            {{
              submitting
                ? '保存中...'
                : isEditMode
                  ? '保存修改'
                  : '确定新增'
            }}
          </button>
        </div>
      </form>

      <aside class="preview-panel">
        <div class="preview-head">
          <h3>预览面板</h3>
          <button type="button" @click="openCurrentDetailPreview">预览详情</button>
        </div>
        <p class="hint">点击星球节点可打开对应详情。</p>
        <p v-if="previewErrorMessage" class="error">{{ previewErrorMessage }}</p>
        <div class="planet-preview">
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

    <MemoryDetail
      v-if="previewDetailMemory"
      :memory="previewDetailMemory"
      @close="previewDetailMemory = null"
    />
  </section>
</template>

<style scoped>
.panel {
  background: #fff;
  border: 1px solid #d5ddee;
  border-radius: 0.8rem;
  padding: 1rem;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 1fr);
  gap: 1rem;
  align-items: start;
}

.form {
  display: grid;
  gap: 0.75rem;
}

.row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.row > label {
  min-width: 0;
}

.upload-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.7rem;
}

.upload-field {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
  font-size: 0.9rem;
}

label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.9rem;
}

input,
select,
textarea {
  border: 1px solid #ccd5e8;
  border-radius: 0.5rem;
  padding: 0.48rem 0.6rem;
  font-size: 0.92rem;
  font-family: inherit;
}

textarea {
  resize: vertical;
}

.upload-field input[type='file'] {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 0.4rem 0.5rem;
  font-size: 0.82rem;
}

.advanced {
  border: 1px dashed #b9c5df;
  border-radius: 0.6rem;
  padding: 0.7rem;
  margin: 0;
  display: grid;
  gap: 0.6rem;
}

.advanced legend {
  padding: 0 0.35rem;
  color: #4a597f;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-panel {
  border: 1px solid #d8e0f1;
  border-radius: 0.7rem;
  padding: 0.7rem;
  background: #f9fbff;
  display: grid;
  gap: 0.55rem;
}

.preview-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
}

.preview-head h3 {
  margin: 0;
  font-size: 0.98rem;
  color: #2a3a63;
}

.planet-preview {
  position: relative;
  height: 400px;
  border-radius: 0.6rem;
  overflow: hidden;
  border: 1px solid #d5deef;
  background: #020611;
}

button {
  border: none;
  border-radius: 0.5rem;
  background: #243b76;
  color: #fff;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
}

.danger-button {
  background: #8e2f2f;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  margin: 0;
  color: #b72929;
}

.success {
  margin: 0;
  color: #1e7a35;
}

.hint {
  margin: 0;
  color: #5d6989;
  font-size: 0.9rem;
}

.upload-result {
  display: grid;
  gap: 0.6rem;
}

.upload-result .hint {
  word-break: break-all;
}

.media-block {
  display: grid;
  gap: 0.4rem;
}

.media-list {
  display: grid;
  gap: 0.35rem;
}

.media-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
  align-items: center;
}

.media-url {
  line-height: 1.3;
}

.field-label {
  font-size: 0.9rem;
}

.required {
  margin-left: 0.15rem;
  color: #b72929;
}

@media (max-width: 780px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .row {
    grid-template-columns: 1fr;
  }
}
</style>
