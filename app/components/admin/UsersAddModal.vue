<template>
  <UModal v-model:open="open" :title="editing ? 'Edit Pengguna' : 'Tambah Pengguna'">
    <UButton label="Tambah Pengguna" icon="i-lucide-plus" color="primary" />

    <template #body>
      <UForm :state="form" @submit="handleSubmit">
        <div class="space-y-4">
          <UFormField label="Nama" name="nama" required>
            <UInput v-model="form.nama" placeholder="Nama lengkap" />
          </UFormField>

          <UFormField label="Email" name="email" required>
            <UInput v-model="form.email" type="email" placeholder="nama@example.com" />
          </UFormField>

          <UFormField label="Password" name="password" :required="!editing">
            <UInput
              v-model="form.password"
              type="password"
              :placeholder="editing ? 'Kosongkan jika tidak ingin mengubah' : 'Minimal 6 karakter'"
            />
          </UFormField>

          <UFormField label="Role" name="role" required>
            <USelect v-model="form.role" :items="roleItems" placeholder="Pilih role" />
          </UFormField>

          <UFormField label="Wilayah" name="region_id">
            <USelect
              v-model="form.region_id"
              :items="regionItems"
              placeholder="Pilih wilayah (opsional)"
              clearable
              class="w-full"
            />
          </UFormField>

          <UFormField label="Status" name="status" required>
            <USelect v-model="form.status" :items="statusItems" />
          </UFormField>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <UButton type="button" variant="ghost" @click="open = false">Batal</UButton>
          <UButton type="submit">Simpan</UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const emit = defineEmits(['submit'])
const toast = useToast()

const open = ref(false)
const editing = ref<any>(null)
const regions = ref<any[]>([])

const form = reactive({
  nama: '',
  email: '',
  password: '',
  role: 'anggota',
  region_id: undefined as number | undefined,
  status: 'active'
})

const roleItems = [
  { label: 'Admin', value: 'admin' },
  { label: 'Koordinator', value: 'koordinator' },
  { label: 'Anggota', value: 'anggota' },
  { label: 'Kepala', value: 'kepala' }
]

const statusItems = [
  { label: 'Aktif', value: 'active' },
  { label: 'Nonaktif', value: 'inactive' }
]

const regionItems = computed(() =>
  regions.value.map(r => ({ label: r.nama, value: Number(r.id) }))
)

function resetForm() {
  Object.assign(form, {
    nama: '',
    email: '',
    password: '',
    role: 'anggota',
    region_id: undefined,
    status: 'active'
  })
}

watch(open, (isOpen) => {
  if (!isOpen) {
    editing.value = null
    resetForm()
  }
})

onMounted(async () => {
  try {
    regions.value = await $fetch('/api/regions')
  } catch {
    regions.value = []
  }
})

function openEdit(row: any) {
  editing.value = row
  Object.assign(form, {
    nama: row.nama,
    email: row.email,
    password: '',
    role: row.role,
    region_id: row.region_id != null ? Number(row.region_id) : undefined,
    status: row.status || 'active'
  })
  open.value = true
}

function close() {
  open.value = false
}

function handleSubmit() {
  if (!form.nama.trim()) {
    toast.add({ color: 'error', title: 'Nama wajib diisi' })
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    toast.add({ color: 'error', title: 'Email tidak valid' })
    return
  }
  if (!editing.value && form.password.length < 6) {
    toast.add({ color: 'error', title: 'Password minimal 6 karakter' })
    return
  }

  emit('submit', { data: { ...form }, editing: editing.value })
}

defineExpose({ openEdit, close })
</script>
