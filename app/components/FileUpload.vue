<template>
  <div class="space-y-3">
    <UCard v-if="!activityId" class="border-dashed">
      <div class="flex flex-col items-center justify-center py-8">
        <UIcon name="i-lucide-upload-cloud" class="w-12 h-12 text-gray-400 mb-2" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Upload file (maksimal {{ maxSizeMB }}MB)</p>
        <UButton icon="i-lucide-plus" size="sm" @click="$refs.fileInput.click()">Pilih File</UButton>
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          :accept="accept"
          @change="onFileChange"
        />
      </div>
    </UCard>

    <div v-if="files.length > 0" class="space-y-2">
      <div v-for="file in files" :key="file.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="flex items-center gap-3">
          <UIcon :name="getFileIcon(file.tipe_mime)" class="w-5 h-5 text-gray-500" />
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ file.nama_file }}</p>
            <p class="text-xs text-gray-500">{{ formatSize(file.ukuran_bytes) }}</p>
          </div>
        </div>
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

    <UAlert v-if="error" color="error" variant="soft" :title="error" @close="error = ''" />
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
const error = ref('')
const success = ref('')
const files = ref<any[]>([])

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

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  error.value = ''
  success.value = ''

  if (file.size > maxSize) {
    error.value = `Ukuran file melebihi batas maksimal ${maxSizeMB}MB`
    return
  }

  const formData = new FormData()
  formData.append('file', file)
  if (props.activityId) {
    formData.append('activity_id', String(props.activityId))
  }

  try {
    deleting.value = true
    const uploaded = await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    files.value.push(uploaded)
    success.value = 'File berhasil diupload'
    emit('uploaded', uploaded)
  } catch (e: any) {
    error.value = e?.statusMessage || 'Gagal upload file'
  } finally {
    deleting.value = false
    target.value = ''
  }
}

async function handleDelete(file: any) {
  try {
    deleting.value = true
    await $fetch(`/api/activity-files/${file.id}`, { method: 'DELETE' })
    files.value = files.value.filter(f => f.id !== file.id)
    success.value = 'File berhasil dihapus'
    emit('deleted', file)
  } catch (e: any) {
    error.value = e?.statusMessage || 'Gagal menghapus file'
  } finally {
    deleting.value = false
  }
}

watch(() => props.activityId, () => {
  loadFiles()
}, { immediate: true })
</script>
