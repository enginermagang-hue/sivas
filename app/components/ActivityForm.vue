<template>
  <UForm
    id="activity-form"
    :schema="schema"
    :state="form"
    class="space-y-4"
    @submit="handleSubmit"
  >
    <div class="space-y-4">
      <UFormField label="Kategori" name="kategori_id" required description="Pilih kategori aktivitas">
        <USelect
          v-model="form.kategori_id"
          :items="categories"
          value-attribute="id"
          option-attribute="nama"
          placeholder="Pilih kategori"
          :disabled="!!activity"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Tanggal" name="tanggal" required :help="activity ? '' : 'Tanggal kegiatan — diisi otomatis hari ini'">
        <UInput v-model="form.tanggal" type="date" :disabled="!!activity" class="w-full" />
      </UFormField>

      <UFormField label="Jam Mulai" name="jam_mulai" hint="Opsional">
        <UInput v-model="form.jam_mulai" type="time" class="w-full" />
      </UFormField>

      <UFormField label="Jam Selesai" name="jam_selesai" hint="Opsional">
        <UInput v-model="form.jam_selesai" type="time" class="w-full" />
      </UFormField>

      <UFormField label="Deskripsi" name="deskripsi" required :help="'Jelaskan aktivitas hari ini — minimal 1 karakter'">
        <UTextarea
          v-model="form.deskripsi"
          :rows="4"
          placeholder="Jelaskan aktivitas hari ini..."
          class="w-full"
        />
      </UFormField>

      <UFormField label="Lampiran" name="files" :description="activity && (activity.files?.length || 0) ? `${activity.files.length} file terhubung` : 'Maksimal 2MB per file'">
        <FileUpload
          v-if="activity"
          :activity-id="activity?.id"
          :max-size="maxSize"
          @uploaded="onFileUploaded"
        />
        <FileUpload
          v-else
          :max-size="maxSize"
          @uploaded="onFileUploaded"
        />
      </UFormField>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { activityCreateSchema, activityUpdateSchema } from '../../../lib/validations'

const props = defineProps<{
  activity?: any
  categories: any[]
  maxSize?: number
}>()

const emit = defineEmits(['submit', 'cancel', 'file-uploaded'])

type Schema = typeof activityCreateSchema | typeof activityUpdateSchema

const schema = computed(() =>
  props.activity ? activityUpdateSchema : activityCreateSchema
) as any

const form = reactive({
  user_id: undefined as number | undefined,
  region_id: undefined as number | undefined,
  kategori_id: undefined as number | undefined,
  tanggal: new Date().toISOString().split('T')[0],
  jam_mulai: null as string | null,
  jam_selesai: null as string | null,
  deskripsi: ''
})

watch(
  () => props.activity,
  (newVal) => {
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
    } else {
      Object.assign(form, {
        user_id: undefined,
        region_id: undefined,
        kategori_id: undefined,
        tanggal: new Date().toISOString().split('T')[0],
        jam_mulai: null,
        jam_selesai: null,
        deskripsi: ''
      })
    }
  },
  { immediate: true }
)

function onFileUploaded(file: any) {
  emit('file-uploaded', file)
}

function handleSubmit(event: FormSubmitEvent<Schema>) {
  emit('submit', event.data)
}
</script>
