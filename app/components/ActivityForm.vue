<template>
  <UForm
    ref="formEl"
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
          value-key="id"
          label-key="nama"
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

      <UFormField label="NPSN" name="npsn" hint="Opsional" description="Ketik NPSN atau pilih dari nama sekolah">
        <UInput v-model="form.npsn" placeholder="cth. 50300269" class="w-full" @input="onNpsnInput" />
      </UFormField>

      <UFormField label="Nama Sekolah" name="nama_sekolah" hint="Opsional" description="Ketik untuk mencari dari 1000+ satuan pendidikan">
        <UInput v-model="form.nama_sekolah" placeholder="Ketik nama sekolah..." list="sekolah-list" class="w-full" />
        <datalist id="sekolah-list">
          <option v-for="n in filteredSekolahNama" :key="n" :value="n" />
        </datalist>
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
          ref="fileUploadRef"
          :activity-id="activity?.id"
          :max-size="maxSize"
          @uploaded="onFileUploaded"
        />
        <FileUpload
          v-else
          ref="fileUploadRef"
          :max-size="maxSize"
          @uploaded="onFileUploaded"
        />
      </UFormField>

      <div v-if="showActions !== false" class="flex justify-end gap-2 pt-2">
        <UButton type="button" variant="ghost" :disabled="busy" @click="emit('cancel')">Batal</UButton>
        <UButton type="submit" color="primary" :loading="busy" :disabled="busy">Simpan</UButton>
      </div>
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
  showActions?: boolean
}>()

const emit = defineEmits(['submit', 'cancel', 'file-uploaded'])

const fileUploadRef = ref<{ flushPending: (activityId: number) => Promise<{ uploaded: any[]; failed: File[] }> } | null>(null)
const busy = ref(false)
const formEl = useTemplateRef('formEl')

function setBusy(value: boolean) {
  busy.value = value
}

async function flushPendingFiles(activityId: number) {
  if (!fileUploadRef.value) return { uploaded: [] as any[], failed: [] as File[] }
  return fileUploadRef.value.flushPending(activityId)
}

defineExpose({ submit: () => formEl.value?.submit(), flushPendingFiles, setBusy })

type Schema = typeof activityCreateSchema | typeof activityUpdateSchema

const schema = computed(() =>
  // user_id & region_id diisi oleh parent saat submit (modal/page),
  // jadi validasi client hanya mencakup field yang ada di form
  props.activity ? activityUpdateSchema : activityCreateSchema.omit({ user_id: true, region_id: true })
) as any

const form = reactive({
  user_id: undefined as number | undefined,
  region_id: undefined as number | undefined,
  kategori_id: undefined as number | undefined,
  tanggal: new Date().toISOString().split('T')[0],
  jam_mulai: null as string | null,
  jam_selesai: null as string | null,
  npsn: null as string | null,
  nama_sekolah: null as string | null,
  deskripsi: ''
})

// Master satuan pendidikan dari public/data/sekolah.json (hasil konversi Satuan Pendidikan.xlsx)
const { data: sekolahList } = useFetch<Array<{ npsn: string; nama: string }>>('/data/sekolah.json', {
  default: () => []
})

const filteredSekolahNama = computed(() => {
  const q = (form.nama_sekolah || '').toLowerCase()
  const list = sekolahList.value || []
  if (!q) return list.slice(0, 50).map((s) => s.nama)
  return list.filter((s) => s.nama.toLowerCase().includes(q) || s.npsn.includes(q)).slice(0, 50).map((s) => s.nama)
})

watch(
  () => form.nama_sekolah,
  (nama) => {
    const name = (nama || '').trim()
    if (!name) return
    const found = (sekolahList.value || []).find((s) => s.nama === name)
    if (found) form.npsn = found.npsn
  }
)

function onNpsnInput() {
  const npsn = (form.npsn || '').trim()
  if (!npsn) return
  const found = (sekolahList.value || []).find((s) => s.npsn === npsn)
  if (found) form.nama_sekolah = found.nama
}

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
        npsn: newVal.npsn ?? null,
        nama_sekolah: newVal.nama_sekolah ?? null,
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
        npsn: null,
        nama_sekolah: null,
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
