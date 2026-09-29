<template>
  <UForm :state="form" @submit="handleSubmit">
    <div class="space-y-4">
      <UFormField label="Kategori" name="kategori_id" required>
        <USelect
          v-model="form.kategori_id"
          :options="categories"
          value-attribute="id"
          option-attribute="nama"
          placeholder="Pilih kategori"
          :disabled="!!activity"
        />
      </UFormField>

      <UFormField label="Tanggal" name="tanggal" required>
        <UInput v-model="form.tanggal" type="date" :disabled="!!activity" />
      </UFormField>

      <UFormField label="Jam Mulai" name="jam_mulai">
        <UInput v-model="form.jam_mulai" type="time" />
      </UFormField>

      <UFormField label="Jam Selesai" name="jam_selesai">
        <UInput v-model="form.jam_selesai" type="time" />
      </UFormField>

      <UFormField label="Deskripsi" name="deskripsi" required>
        <UTextarea v-model="form.deskripsi" :rows="4" placeholder="Jelaskan aktivitas hari ini..." />
      </UFormField>

      <UFormField label="Lampiran" name="files">
        <FileUpload
          :activity-id="activity?.id"
          :max-size="maxSize"
          @uploaded="onFileUploaded"
        />
      </UFormField>
    </div>

    <div class="flex justify-end gap-2 mt-6">
      <UButton type="button" variant="ghost" @click="$emit('cancel')">Batal</UButton>
      <UButton type="submit" :loading="saving">Simpan</UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
const props = defineProps<{
  activity?: any
  users?: any[]
  regions?: any[]
  categories: any[]
  maxSize?: number
}>()

const emit = defineEmits(['submit', 'cancel', 'file-uploaded'])

const saving = ref(false)
const form = reactive({
  user_id: undefined as number | undefined,
  region_id: undefined as number | undefined,
  kategori_id: undefined as number | undefined,
  tanggal: new Date().toISOString().split('T')[0],
  jam_mulai: null as string | null,
  jam_selesai: null as string | null,
  deskripsi: ''
})

watch(() => props.activity, (newVal) => {
  if (newVal) {
    Object.assign(form, {
      user_id: newVal.user_id,
      region_id: newVal.region_id,
      kategori_id: newVal.kategori_id,
      tanggal: newVal.tanggal,
      jam_mulai: newVal.jam_mulai,
      jam_selesai: newVal.jam_selesai,
      deskripsi: newVal.deskripsi
    })
  }
}, { immediate: true })

function onFileUploaded(file: any) {
  emit('file-uploaded', file)
}

async function handleSubmit() {
  saving.value = true
  try {
    await emit('submit', { ...form })
  } finally {
    saving.value = false
  }
}
</script>
