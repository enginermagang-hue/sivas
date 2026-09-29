<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Kelola Kategori</h1>
      <UButton icon="i-lucide-plus" @click="openCreate">Tambah Kategori</UButton>
    </div>

    <UCard>
      <UTable :rows="categories" :columns="columns">
        <template #warna-data="{ row }">
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded-full" :style="{ backgroundColor: row.warna }"></span>
            <span class="text-sm text-gray-600 dark:text-gray-300">{{ row.warna }}</span>
          </div>
        </template>
        <template #icon-data="{ row }">
          <span v-if="row.icon" class="text-sm text-gray-600 dark:text-gray-300">{{ row.icon }}</span>
          <span v-else class="text-sm text-gray-400">-</span>
        </template>
        <template #actions-data="{ row }">
          <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm" @click="openEdit(row)" />
          <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="confirmDelete(row)" />
        </template>
      </UTable>
    </UCard>

    <UModal v-model="showModal" :title="editingCategory ? 'Edit Kategori' : 'Tambah Kategori'">
      <UForm :state="form" @submit="handleSubmit">
        <div class="space-y-4">
          <UFormField label="Nama Kategori" name="nama" required>
            <UInput v-model="form.nama" />
          </UFormField>
          <UFormField label="Warna" name="warna">
            <div class="flex items-center gap-2">
              <UInput v-model="form.warna" type="color" class="w-16 h-10" />
              <UInput v-model="form.warna" placeholder="#3B82F6" />
            </div>
          </UFormField>
          <UFormField label="Icon" name="icon">
            <UInput v-model="form.icon" placeholder="contoh: i-lucide-star" />
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

    <UModal v-model="showDeleteModal" title="Hapus Kategori">
      <p class="text-gray-600 dark:text-gray-300">Apakah Anda yakin ingin menghapus kategori <strong>{{ deletingCategory?.nama }}</strong>?</p>
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

const categories = ref<any[]>([])
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingCategory = ref<any>(null)
const deletingCategory = ref<any>(null)
const saving = ref(false)
const deleting = ref(false)

const form = reactive({
  nama: '',
  warna: '#3B82F6',
  icon: ''
})

const columns = [
  { key: 'nama', label: 'Nama' },
  { key: 'warna', label: 'Warna' },
  { key: 'icon', label: 'Icon' },
  { key: 'actions', label: 'Aksi' }
]

async function loadCategories() {
  const data = await $fetch('/api/categories')
  categories.value = data
}

function openCreate() {
  editingCategory.value = null
  Object.assign(form, { nama: '', warna: '#3B82F6', icon: '' })
  showModal.value = true
}

function openEdit(row: any) {
  editingCategory.value = row
  Object.assign(form, { nama: row.nama, warna: row.warna, icon: row.icon || '' })
  showModal.value = true
}

function confirmDelete(row: any) {
  deletingCategory.value = row
  showDeleteModal.value = true
}

async function handleSubmit() {
  saving.value = true
  try {
    if (editingCategory.value) {
      await $fetch(`/api/categories/${editingCategory.value.id}`, {
        method: 'PUT',
        body: form
      })
      toast.add({ color: 'success', title: 'Kategori berhasil diperbarui' })
    } else {
      await $fetch('/api/categories', {
        method: 'POST',
        body: form
      })
      toast.add({ color: 'success', title: 'Kategori berhasil ditambahkan' })
    }
    showModal.value = false
    await loadCategories()
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menyimpan' })
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await $fetch(`/api/categories/${deletingCategory.value.id}`, { method: 'DELETE' })
    toast.add({ color: 'success', title: 'Kategori berhasil dihapus' })
    showDeleteModal.value = false
    await loadCategories()
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menghapus' })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await loadCategories()
})
</script>
