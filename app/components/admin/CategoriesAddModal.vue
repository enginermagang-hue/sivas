<template>
  <UModal v-model:open="open" :title="editing ? 'Edit Kategori' : 'Tambah Kategori'">
    <UButton label="Tambah Kategori" icon="i-lucide-plus" color="primary" />

    <template #body>
      <UForm :state="form" @submit="handleSubmit">
        <div class="space-y-4">
          <UFormField label="Nama Kategori" name="nama" required>
            <UInput v-model="form.nama" placeholder="Nama kategori" />
          </UFormField>

          <UFormField label="Warna" name="warna" required>
            <div class="flex items-center gap-2 w-full">
              <UInput v-model="form.warna" type="color" class="w-16 h-10 shrink-0" />
              <UInput v-model="form.warna" placeholder="#3B82F6" class="flex-1" />
            </div>
          </UFormField>

          <UFormField label="Icon" name="icon">
            <UInput v-model="form.icon" placeholder="contoh: i-lucide-star" class="w-full" />
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

const form = reactive({
  nama: '',
  warna: '#3B82F6',
  icon: ''
})

function resetForm() {
  Object.assign(form, {
    nama: '',
    warna: '#3B82F6',
    icon: ''
  })
}

watch(open, (isOpen) => {
  if (!isOpen) {
    editing.value = null
    resetForm()
  }
})

function openEdit(row: any) {
  editing.value = row
  Object.assign(form, {
    nama: row.nama,
    warna: row.warna || '#3B82F6',
    icon: row.icon || ''
  })
  open.value = true
}

function close() {
  open.value = false
}

function handleSubmit() {
  if (!form.nama.trim()) {
    toast.add({ color: 'error', title: 'Nama kategori wajib diisi' })
    return
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(form.warna)) {
    toast.add({ color: 'error', title: 'Format warna tidak valid (contoh: #3B82F6)' })
    return
  }

  emit('submit', { data: { ...form, icon: form.icon || null }, editing: editing.value })
}

defineExpose({ openEdit, close })
</script>
