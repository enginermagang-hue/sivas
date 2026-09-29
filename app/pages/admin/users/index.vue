<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Kelola Pengguna</h1>
      <UButton icon="i-lucide-plus" @click="openCreate">Tambah Pengguna</UButton>
    </div>

    <UCard>
      <UTable :rows="users" :columns="columns">
        <template #nama-data="{ row }">
          <div class="font-medium text-gray-900 dark:text-white">{{ row.nama }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">{{ row.email }}</div>
        </template>
        <template #role-data="{ row }">
          <UBadge :color="roleColor(row.role)" variant="soft" size="sm">
            {{ roleLabel(row.role) }}
          </UBadge>
        </template>
        <template #region_id-data="{ row }">
          <span v-if="row.region_id" class="text-sm text-gray-600 dark:text-gray-300">{{ getRegionName(row.region_id) }}</span>
          <span v-else class="text-sm text-gray-400">-</span>
        </template>
        <template #status-data="{ row }">
          <UBadge :color="row.status === 'active' ? 'success' : 'error'" variant="soft" size="sm">
            {{ row.status === 'active' ? 'Aktif' : 'Nonaktif' }}
          </UBadge>
        </template>
        <template #actions-data="{ row }">
          <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm" @click="openEdit(row)" />
          <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="confirmDelete(row)" />
        </template>
      </UTable>
    </UCard>

    <UModal v-model="showModal" :title="editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'">
      <UForm :state="form" @submit="handleSubmit">
        <div class="space-y-4">
          <UFormField label="Nama" name="nama" required>
            <UInput v-model="form.nama" />
          </UFormField>
          <UFormField label="Email" name="email" required>
            <UInput v-model="form.email" type="email" />
          </UFormField>
          <UFormField label="Password" name="password" :required="!editingUser">
            <UInput v-model="form.password" type="password" :placeholder="editingUser ? 'Kosongkan jika tidak ingin mengubah' : ''" />
          </UFormField>
          <UFormField label="Role" name="role" required>
            <USelect v-model="form.role" :options="roleOptions" />
          </UFormField>
          <UFormField label="Wilayah" name="region_id">
            <USelect v-model="form.region_id" :options="regionOptions" value-attribute="id" option-attribute="nama" placeholder="Pilih wilayah (opsional)" clearable />
          </UFormField>
          <UFormField label="Status" name="status" required>
            <USelect v-model="form.status" :options="statusOptions" />
          </UFormField>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton type="button" variant="ghost" @click="showModal = false">Batal</UButton>
            <UButton type="submit" :loading="saving">Simpan</UButton>
          </div>
        </template>
      </UForm>
    </UModal>

    <UModal v-model="showDeleteModal" title="Hapus Pengguna">
      <p class="text-gray-600 dark:text-gray-300">Apakah Anda yakin ingin menghapus pengguna <strong>{{ deletingUser?.nama }}</strong>?</p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="showDeleteModal = false">Batal</UButton>
          <UButton color="error" :loading="deleting" @click="handleDelete">Hapus</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { user } = useAuth()
const toast = useToast()

if (user.value?.role !== 'admin') {
  throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan' })
}

const users = ref<any[]>([])
const regions = ref<any[]>([])
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingUser = ref<any>(null)
const deletingUser = ref<any>(null)
const saving = ref(false)
const deleting = ref(false)

const form = reactive({
  nama: '',
  email: '',
  password: '',
  role: 'anggota',
  region_id: null as number | null,
  status: 'active'
})

const columns = [
  { key: 'nama', label: 'Nama' },
  { key: 'role', label: 'Role' },
  { key: 'region_id', label: 'Wilayah' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Aksi' }
]

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

function roleColor(role: string) {
  const colors: Record<string, string> = {
    admin: 'red',
    koordinator: 'blue',
    anggota: 'green',
    kepala: 'purple'
  }
  return colors[role] || 'neutral'
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: 'Admin',
    koordinator: 'Koordinator',
    anggota: 'Anggota',
    kepala: 'Kepala'
  }
  return labels[role] || role
}

function getRegionName(regionId: number) {
  const region = regions.value.find(r => r.id === regionId)
  return region?.nama || '-'
}

const regionOptions = computed(() => regions.value)

async function loadUsers() {
  const data = await $fetch('/api/users')
  users.value = data
}

async function loadRegions() {
  const data = await $fetch('/api/regions')
  regions.value = data
}

function openCreate() {
  editingUser.value = null
  Object.assign(form, {
    nama: '',
    email: '',
    password: '',
    role: 'anggota',
    region_id: null,
    status: 'active'
  })
  showModal.value = true
}

function openEdit(row: any) {
  editingUser.value = row
  Object.assign(form, {
    nama: row.nama,
    email: row.email,
    password: '',
    role: row.role,
    region_id: row.region_id,
    status: row.status
  })
  showModal.value = true
}

function confirmDelete(row: any) {
  deletingUser.value = row
  showDeleteModal.value = true
}

async function handleSubmit() {
  saving.value = true
  try {
    if (editingUser.value) {
      await $fetch(`/api/users/${editingUser.value.id}`, {
        method: 'PUT',
        body: form
      })
      toast.add({ color: 'success', title: 'Pengguna berhasil diperbarui' })
    } else {
      await $fetch('/api/users', {
        method: 'POST',
        body: form
      })
      toast.add({ color: 'success', title: 'Pengguna berhasil ditambahkan' })
    }
    showModal.value = false
    await loadUsers()
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menyimpan' })
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await $fetch(`/api/users/${deletingUser.value.id}`, { method: 'DELETE' })
    toast.add({ color: 'success', title: 'Pengguna berhasil dihapus' })
    showDeleteModal.value = false
    await loadUsers()
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menghapus' })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await loadRegions()
  await loadUsers()
})
</script>
