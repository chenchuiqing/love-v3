<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { Memory, MemoryType, ParticleTheme } from '@/types/memory'
import { ApiError } from '@/api/client'
import {
  createAdminMemory,
  fetchAdminMemories,
  fetchAdminMemoryById,
  updateAdminMemory,
  uploadAdminMedia,
} from '@/api/memories'
import MemoryDetail from '@/components/MemoryDetail.vue'
import MemoryPlanet from '@/components/MemoryPlanet.vue'

interface FormState {
  id: string
  type: MemoryType
  title: string
  date: string
  color: string
  theta: number
  phi: number
  orbitRadius: number
  text: string
  imageUrl: string
  audioUrl: string
  location: string
  theme: ParticleTheme
}

const route = useRoute()
const router = useRouter()

const typeOptions: MemoryType[] = ['photo', 'date', 'chat', 'location', 'music']
const themeOptions: ParticleTheme[] = [
  'default',
  'ocean',
  'forest',
  'city',
  'sky',
  'summit',
  'sunshine',
  'meadow',
  'night',
  'fireworks',
  'moonlight',
  'neon',
]

const form = reactive<FormState>({
  id: '',
  type: 'photo',
  title: '',
  date: '',
  color: '#6AA0FF',
  theta: 1.8,
  phi: 1.2,
  orbitRadius: 1.08,
  text: '',
  imageUrl: '',
  audioUrl: '',
  location: '',
  theme: 'default',
})

const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const isUploadingImage = ref(false)
const isUploadingAudio = ref(false)
const previewErrorMessage = ref('')
const previewCatalog = ref<Memory[]>([])
const previewDetailMemory = ref<Memory | null>(null)

const isEditMode = computed(() => typeof route.params.id === 'string' && route.params.id.length > 0)
const currentId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const previewFormMemory = computed<Memory>(() => {
  return {
    id: form.id || '__preview_draft__',
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
      imageUrl: form.imageUrl || undefined,
      audioUrl: form.audioUrl || undefined,
      location: form.location || undefined,
      theme: form.theme || undefined,
    },
  }
})
const previewPlanetMemories = computed<Memory[]>(() => {
  const catalogWithoutCurrent = previewCatalog.value.filter((item) => item.id !== previewFormMemory.value.id)
  return [...catalogWithoutCurrent, previewFormMemory.value]
})

const normalizeSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const applyMemoryToForm = (memory: Memory) => {
  form.id = memory.id
  form.type = memory.type
  form.title = memory.title
  form.date = memory.date
  form.color = memory.color
  form.theta = memory.position.theta
  form.phi = memory.position.phi
  form.orbitRadius = memory.orbitRadius
  form.text = memory.content.text ?? ''
  form.imageUrl = memory.content.imageUrl ?? ''
  form.audioUrl = memory.content.audioUrl ?? ''
  form.location = memory.content.location ?? ''
  form.theme = memory.content.theme ?? 'default'
}

const buildCreatePayload = (): Memory => {
  return {
    id: form.id,
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
      imageUrl: form.imageUrl || undefined,
      audioUrl: form.audioUrl || undefined,
      location: form.location || undefined,
      theme: form.theme || undefined,
    },
  }
}

const buildUpdatePayload = (): Omit<Memory, 'id'> => {
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
      imageUrl: form.imageUrl || undefined,
      audioUrl: form.audioUrl || undefined,
      location: form.location || undefined,
      theme: form.theme || undefined,
    },
  }
}

const loadPreviewCatalog = async () => {
  previewErrorMessage.value = ''
  try {
    previewCatalog.value = await fetchAdminMemories()
  } catch (error) {
    if (error instanceof Error) {
      previewErrorMessage.value = error.message
      return
    }
    previewErrorMessage.value = '预览列表加载失败'
  }
}

watch(
  () => form.title,
  (nextTitle) => {
    if (isEditMode.value || form.id.trim().length > 0) {
      return
    }
    const slug = normalizeSlug(nextTitle)
    form.id = slug ? `memory-${slug}` : ''
  },
)

const refillAutoPosition = () => {
  form.theta = Number((Math.random() * Math.PI * 2).toFixed(4))
  form.phi = Number((Math.random() * Math.PI).toFixed(4))
  form.orbitRadius = Number((1.05 + Math.random() * 0.1).toFixed(4))
}

const uploadFile = async (file: File, target: 'image' | 'audio') => {
  errorMessage.value = ''
  if (target === 'image') {
    isUploadingImage.value = true
  } else {
    isUploadingAudio.value = true
  }
  try {
    const url = await uploadAdminMedia(file)
    if (target === 'image') {
      form.imageUrl = url
    } else {
      form.audioUrl = url
    }
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '上传失败'
    }
  } finally {
    if (target === 'image') {
      isUploadingImage.value = false
    } else {
      isUploadingAudio.value = false
    }
  }
}

const handleUploadImage = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await uploadFile(file, 'image')
  input.value = ''
}

const handleUploadAudio = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await uploadFile(file, 'audio')
  input.value = ''
}

const handleSubmit = async () => {
  errorMessage.value = ''
  if (!form.title || !form.date || !form.id) {
    errorMessage.value = '请先填写 ID、标题、日期'
    return
  }

  submitting.value = true
  try {
    if (isEditMode.value) {
      await updateAdminMemory(currentId.value, buildUpdatePayload())
    } else {
      await createAdminMemory(buildCreatePayload())
    }
    await router.push({ name: 'AdminMemoryList' })
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      errorMessage.value = 'ID 已存在，请更换'
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
    return
  }
  loading.value = true
  try {
    const memory = await fetchAdminMemoryById(currentId.value)
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
          ID
          <input v-model.trim="form.id" :disabled="isEditMode" />
        </label>

        <label>
          标题
          <input v-model.trim="form.title" />
        </label>

        <div class="row">
          <label>
            类型
            <select v-model="form.type">
              <option v-for="item in typeOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>

          <label>
            日期
            <input v-model.trim="form.date" placeholder="例如 2025-05-20" />
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
              <option v-for="item in themeOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>
        </div>

        <label>
          文案
          <textarea v-model.trim="form.text" rows="4"></textarea>
        </label>

        <div class="row">
          <label>
            地点
            <input v-model.trim="form.location" />
          </label>
          <label>
            音频地址
            <input v-model.trim="form.audioUrl" />
          </label>
        </div>

        <label>
          图片地址
          <input v-model.trim="form.imageUrl" />
        </label>

        <div class="row upload-row">
          <label>
            上传图片
            <input type="file" accept="image/*" @change="handleUploadImage" />
          </label>
          <label>
            上传音频
            <input type="file" accept="audio/mpeg,audio/mp3" @change="handleUploadAudio" />
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
        <p class="hint" v-if="isUploadingImage || isUploadingAudio">
          {{ isUploadingImage ? '图片上传中...' : '' }}
          {{ isUploadingAudio ? '音频上传中...' : '' }}
        </p>

        <div class="footer">
          <RouterLink :to="{ name: 'AdminMemoryList' }">取消</RouterLink>
          <button type="submit" :disabled="submitting">
            {{ submitting ? '保存中...' : '保存' }}
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

.upload-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  margin: 0;
  color: #b72929;
}

.hint {
  margin: 0;
  color: #5d6989;
  font-size: 0.9rem;
}

@media (max-width: 780px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .row,
  .upload-row {
    grid-template-columns: 1fr;
  }
}
</style>
