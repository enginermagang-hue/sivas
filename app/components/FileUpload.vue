<template>
  <div class="space-y-3">
    <UCard v-if="!activityId" class="border-dashed">
      <div class="flex flex-col items-center justify-center py-8">
        <UIcon name="i-lucide-upload-cloud" class="w-12 h-12 text-gray-400 mb-2" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Upload file (maksimal {{ maxSizeMB }}MB)</p>
        <UButton icon="i-lucide-plus" size="sm" @click="openPicker()">Pilih File</UButton>
        <input
          ref="fileInputRef"
          type="file"
          class="hidden"
          :accept="accept"
          @change="onFileChange"
        />
      </div>
    </UCard>

    <div v-if="pendingFiles.length > 0" class="space-y-2">
      <div v-for="(file, index) in pendingFiles" :key="`${file.name}-${file.size}-${file.lastModified}`" class="flex items-center justify-between p-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/30">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-clock" class="w-5 h-5 text-amber-500" />
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ file.name }}</p>
            <p class="text-xs text-gray-500">Menunggu activity disimpan &middot; {{ formatSize(file.size) }}</p>
          </div>
        </div>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="removePending(index)"
        />
      </div>
    </div>

    <div v-if="files.length > 0" class="space-y-2">
      <div v-for="file in files" :key="file.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="flex items-center gap-3">
          <UIcon :name="getFileIcon(file.tipe_mime)" class="w-5 h-5 text-gray-500" />
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ file.nama_file }}</p>
            <p class="text-xs text-gray-500">{{ formatSize(file.ukuran_bytes) }}</p>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <UButton
            icon="i-lucide-download"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Unduh file"
            @click="openDownload(file.id)"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            :disabled="deleting"
            @click="handleDelete(file)"
          />
        </div>
      </div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" @close="error = ''" />
    <UAlert v-if="driveExpired" color="warning" variant="soft" title="Koneksi Google Drive terputus">
      <template #description>
        Hubungkan ulang akun Google dari halaman
        <NuxtLink to="/admin/integrations" class="underline font-medium">Integrations</NuxtLink>,
        lalu coba lagi.
      </template>
    </UAlert>
    <UAlert v-if="success" color="success" variant="soft" :title="success" @close="success = ''" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  activityId?: number
  maxSize?: number
  accept?: string
}>()

const emit = defineEmits(['uploaded', 'deleted'])

const maxSize = props.maxSize || 2 * 1024 * 1024
const maxSizeMB = Math.round(maxSize / 1024 / 1024)
const accept = props.accept || 'image/*,.pdf,.doc,.docx,.xls,.xlsx'
const deleting = ref(false)
const uploading = ref(false)
const error = ref('')
const driveExpired = ref(false)
const success = ref('')
const files = ref<any[]>([])
const pendingFiles = ref<File[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

function openPicker() {
  fileInputRef.value?.click()
}

function responseMessage(eventError: any, fallback: string) {
  return eventError?.data?.statusMessage || eventError?.statusMessage || eventError?.message || fallback
}

function isDriveExpired(eventError: any) {
  return Number(eventError?.statusCode ?? eventError?.status ?? 0) === 401 &&
    /google drive/i.test(responseMessage(eventError, ''))
}

async function loadFiles() {
  if (!props.activityId) return
  try {
    const data = await $fetch(`/api/activities/${props.activityId}`)
    files.value = data.files || []
  } catch {
    // ignore
  }
}

function getFileIcon(mimeType?: string) {
  if (!mimeType) return 'i-lucide-file'
  if (mimeType.startsWith('image/')) return 'i-lucide-image'
  if (mimeType === 'application/pdf') return 'i-lucide-file-text'
  if (mimeType.includes('word')) return 'i-lucide-file-text'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'i-lucide-file-spreadsheet'
  return 'i-lucide-file'
}

function formatSize(bytes?: number) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function uploadOne(file: File, activityId: number) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('activity_id', String(activityId))
  const uploaded = await $fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
  files.value.push(uploaded)
  emit('uploaded', uploaded)
  return uploaded
}

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  error.value = ''
  driveExpired.value = false
  success.value = ''

  if (file.size > maxSize) {
    error.value = `Ukuran file melebihi batas maksimal ${maxSizeMB}MB`
    target.value = ''
    return
  }

  if (!props.activityId) {
    pendingFiles.value.push(file)
    success.value = 'File ditahan dan akan diupload setelah activity disimpan'
    target.value = ''
    return
  }

  try {
    uploading.value = true
    await uploadOne(file, props.activityId)
    success.value = 'File berhasil diupload'
  } catch (e: any) {
    driveExpired.value = isDriveExpired(e)
    error.value = responseMessage(e, 'Gagal upload file')
  } finally {
    uploading.value = false
    target.value = ''
  }
}

function removePending(index: number) {
  pendingFiles.value.splice(index, 1)
}

async function flushPending(activityId: number) {
  if (pendingFiles.value.length === 0) {
    return { uploaded: [] as any[], failed: [] as File[] }
  }

  error.value = ''
  driveExpired.value = false
  success.value = ''
  uploading.value = true

  const uploaded: any[] = []
  const failed: File[] = []
  const queued = [...pendingFiles.value]
  pendingFiles.value = []

  for (const file of queued) {
    try {
      const result = await uploadOne(file, activityId)
      uploaded.push(result)
    } catch (e: any) {
      driveExpired.value = isDriveExpired(e)
      error.value = responseMessage(e, 'Sebagian file gagal diupload')
      failed.push(file)
    }
  }

  pendingFiles.value = failed
  if (uploaded.length > 0 && failed.length === 0) {
    success.value = 'File berhasil diupload'
  }
  uploading.value = false
  return { uploaded, failed }
}

function openDownload(fileId: number) {
  window.open(`/api/activity-files/${fileId}`, '_blank', 'noopener')
}

async function handleDelete(file: any) {
  try {
    deleting.value = true
    await $fetch(`/api/activity-files/${file.id}`, { method: 'DELETE' })
    files.value = files.value.filter(f => f.id !== file.id)
    success.value = 'File berhasil dihapus'
    emit('deleted', file)
  } catch (e: any) {
    driveExpired.value = isDriveExpired(e)
    error.value = responseMessage(e, 'Gagal menghapus file')
  } finally {
    deleting.value = false
  }
}

watch(() => props.activityId, () => {
  loadFiles()
}, { immediate: true })

defineExpose({ flushPending, pendingCount: computed(() => pendingFiles.value.length), uploading })
</script>
