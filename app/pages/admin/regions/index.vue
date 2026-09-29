<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Kelola Wilayah</h1>
      <UButton icon="i-lucide-plus" @click="openCreate">Tambah Wilayah</UButton>
    </div>

    <UCard>
      <UTable :rows="regions" :columns="columns">
        <template #actions-data="{ row }">
          <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm" @click="openEdit(row)" />
          <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="confirmDelete(row)" />
        </template>
      </UTable>
    </UCard>

    <UModal v-model="showModal" :title="editingRegion ? 'Edit Wilayah' : 'Tambah Wilayah'">
      <UForm :state="form" @submit="handleSubmit">
        <div class="space-y-4">
          <UFormField label="Nama Wilayah" name="nama" required>
            <UInput v-model="form.nama" />
          </UFormField>
          <UFormField label="Kode Wilayah" name="kode" required>
            <UInput v-model="form.kode" />
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

    <UModal v-model="showDeleteModal" title="Hapus Wilayah">
      <p class="text-gray-600 dark:text-gray-300">Apakah Anda yakin ingin menghapus wilayah <strong>{{ deletingRegion?.nama }}</strong>?</p>
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

const regions = ref<any[]>([])
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingRegion = ref<any>(null)
const deletingRegion = ref<any>(null)
const saving = ref(false)
const deleting = ref(false)

const form = reactive({
  nama: '',
  kode: ''
})

const columns = [
  { key: 'nama', label: 'Nama Wilayah' },
  { key: 'kode', label: 'Kode' },
  { key: 'actions', label: 'Aksi' }
]

async function loadRegions() {
  const data = await $fetch('/api/regions')
  regions.value = data
}

function openCreate() {
  editingRegion.value = null
  Object.assign(form, { nama: '', kode: '' })
  showModal.value = true
}

function openEdit(row: any) {
  editingRegion.value = row
  Object.assign(form, { nama: row.nama, kode: row.kode })
  showModal.value = true
}

function confirmDelete(row: any) {
  deletingRegion.value = row
  showDeleteModal.value = true
}

async function handleSubmit() {
  saving.value = true
  try {
    if (editingRegion.value) {
      await $fetch(`/api/regions/${editingRegion.value.id}`, {
        method: 'PUT',
        body: form
      })
      toast.add({ color: 'success', title: 'Wilayah berhasil diperbarui' })
    } else {
      await $fetch('/api/regions', {
        method: 'POST',
        body: form
      })
      toast.add({ color: 'success', title: 'Wilayah berhasil ditambahkan' })
    }
    showModal.value = false
    await loadRegions()
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menyimpan' })
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await $fetch(`/api/regions/${deletingRegion.value.id}`, { method: 'DELETE' })
    toast.add({ color: 'success', title: 'Wilayah berhasil dihapus' })
    showDeleteModal.value = false
    await loadRegions()
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menghapus' })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await loadRegions()
})
</script>
