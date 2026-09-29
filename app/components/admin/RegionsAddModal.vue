<template>
  <UModal v-model:open="open" :title="editing ? 'Edit Wilayah' : 'Tambah Wilayah'">
    <UButton label="Tambah Wilayah" icon="i-lucide-plus" color="primary" />

    <template #body>
      <UForm :state="form" @submit="handleSubmit">
        <div class="space-y-4">
          <UFormField label="Nama Wilayah" name="nama" required>
            <UInput v-model="form.nama" placeholder="Nama wilayah" />
          </UFormField>

          <UFormField label="Kode" name="kode" required>
            <UInput v-model="form.kode" placeholder="contoh: SIV-01" />
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
  kode: ''
})

function resetForm() {
  Object.assign(form, {
    nama: '',
    kode: ''
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
    kode: row.kode
  })
  open.value = true
}

function close() {
  open.value = false
}

function handleSubmit() {
  if (!form.nama.trim()) {
    toast.add({ color: 'error', title: 'Nama wilayah wajib diisi' })
    return
  }
  if (!form.kode.trim()) {
    toast.add({ color: 'error', title: 'Kode wilayah wajib diisi' })
    return
  }

  emit('submit', { data: { ...form }, editing: editing.value })
}

defineExpose({ openEdit, close })
</script>
