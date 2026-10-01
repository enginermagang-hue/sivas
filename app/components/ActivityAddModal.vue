<template>
  <UModal v-model:open="open" :title="editing ? 'Edit Aktivitas' : 'Input Aktivitas'" :description="editing ? 'Perbarui detail aktivitas ini.' : 'Catat aktivitas harian Anda. Pilih kategori, tanggal, dan jelaskan kegiatan.'" :ui="{ footer: 'justify-end' }">
    <UButton v-if="!hideTrigger" label="Input Aktivitas" icon="i-lucide-plus" color="primary" />

    <template #body>
      <ActivityForm
        ref="activityFormRef"
        :activity="editing"
        :categories="categories"
        :maxSize="2097152"
        :show-actions="false"
        @submit="handleSubmit"
        @cancel="open = false"
        @file-uploaded="handleFileUploaded"
      />
    </template>

    <template #footer>
      <UButton type="button" variant="ghost" :disabled="busy" @click="open = false">Batal</UButton>
      <UButton type="button" color="primary" :loading="busy" :disabled="busy" @click="activityFormRef?.submit()">Simpan</UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import ActivityForm from '~/components/ActivityForm.vue'

const props = withDefaults(defineProps<{ hideTrigger?: boolean }>(), { hideTrigger: false })

const emit = defineEmits(['success'])
const toast = useToast()
const { user } = useAuth()
const open = ref(false)
const editing = ref<any>(null)
const categories = ref<any[]>([])
const busy = ref(false)
const activityFormRef = ref<{
  submit: () => void
  flushPendingFiles: (activityId: number) => Promise<{ uploaded: any[]; failed: File[] }>
  setBusy: (value: boolean) => void
} | null>(null)

async function loadCategories() {
  try {
    categories.value = await $fetch('/api/categories')
  } catch {
    categories.value = []
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    loadCategories()
  }
})

function openModal() {
  open.value = true
}

function openEdit(activity: any) {
  editing.value = activity
  open.value = true
}

function close() {
  editing.value = null
  open.value = false
}

function handleFileUploaded(file: any) {
  // optional: toast file uploaded
}

async function handleSubmit(form: any) {
  busy.value = true
  try {
    if (editing.value) {
      await $fetch(`/api/activities/${editing.value.id}`, { method: 'PUT', body: form })
      toast.add({ color: 'success', title: 'Aktivitas berhasil diperbarui' })
    } else {
      const created: any = await $fetch('/api/activities', {
        method: 'POST',
        body: {
          ...form,
          user_id: user.value?.id,
          region_id: user.value?.regionId
        }
      })
      const flush = await activityFormRef.value?.flushPendingFiles(Number(created.id))
      if (flush && flush.failed.length > 0) {
        toast.add({ color: 'warning', title: 'Aktivitas tersimpan, tetapi sebagian lampiran gagal diupload' })
      } else {
        toast.add({ color: 'success', title: 'Aktivitas berhasil disimpan' })
      }
    }
    open.value = false
    editing.value = null
    emit('success')
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menyimpan aktivitas' })
  } finally {
    busy.value = false
  }
}

defineExpose({ open: openModal, openEdit, close })
</script>
