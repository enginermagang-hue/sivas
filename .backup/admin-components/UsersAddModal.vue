<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

const open = ref(false)
const editing = ref<any>(null)

const form = reactive({
  nama: '',
  email: '',
  password: '',
  role: 'anggota',
  region_id: null as number | null,
  status: 'active'
})

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Koordinator', value: 'koordinator' },
  { label: 'Anggota', value: 'anggota' },
  { label: 'Kepala', value: 'kepala' }
]

const statusOptions = [
  { label: 'Aktif', value: 'active' },
  { label: 'Nonaktif', value: 'inactive' }
]

const regions = ref<any[]>([])
const users = ref<any[]>([])

const emit = defineEmits(['submit', 'close'])

async function loadRegions() {
  const data = await $fetch('/api/regions')
  regions.value = data
}

const regionOptions = computed(() => regions.value)

function openCreate() {
  editing.value = null
  Object.assign(form, {
    nama: '',
    email: '',
    password: '',
    role: 'anggota',
    region_id: null,
    status: 'active'
  })
  open.value = true
}

function openEdit(row: any) {
  editing.value = row
  Object.assign(form, {
    nama: row.nama,
    email: row.email,
    password: '',
    role: row.role,
    region_id: row.region_id,
    status: row.status
  })
  open.value = true
}

async function handleSubmit(event: FormSubmitEvent<any>) {
  emit('submit', { data: event.data, editing: editing.value })
  open.value = false
}

async function handleClose() {
  open.value = false
  emit('close')
}

defineExpose({
  openCreate,
  openEdit
})

onMounted(async () => {
  await loadRegions()
})
</script>

<template>
  <UModal v-model:open="open" :title="editing ? 'Edit Pengguna' : 'Tambah Pengguna'">
    <UButton icon="i-lucide-plus" label="Tambah Pengguna" />

    <template #body>
      <UForm :state="form" @submit="handleSubmit">
        <div class="space-y-4">
          <UFormField label="Nama" name="nama" required>
            <UInput v-model="form.nama" />
          </UFormField>
          <UFormField label="Email" name="email" required>
            <UInput v-model="form.email" type="email" />
          </UFormField>
          <UFormField label="Password" name="password" :required="!editing">
            <UInput v-model="form.password" type="password" :placeholder="editing ? 'Kosongkan jika tidak ingin mengubah' : ''" />
          </UFormField>
          <UFormField label="Role" name="role" required>
            <USelect v-model="form.role" :items="roleOptions" />
          </UFormField>
          <UFormField label="Wilayah" name="region_id">
            <USelect v-model="form.region_id" :items="regionOptions" value-attribute="value" option-attribute="label" placeholder="Pilih wilayah (opsional)" clearable />
          </UFormField>
          <UFormField label="Status" name="status" required>
            <USelect v-model="form.status" :items="statusOptions" />
          </UFormField>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton type="button" variant="ghost" @click="handleClose">Batal</UButton>
            <UButton type="submit">Simpan</UButton>
          </div>
        </template>
      </UForm>
    </template>
  </UModal>
</template>
