<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

const open = ref(false)
const editing = ref<any>(null)

const form = reactive({
  nama: '',
  warna: '#3B82F6',
  icon: ''
})

const emit = defineEmits(['submit', 'close'])

function openCreate() {
  editing.value = null
  Object.assign(form, { nama: '', warna: '#3B82F6', icon: '' })
  open.value = true
}

function openEdit(row: any) {
  editing.value = row
  Object.assign(form, { nama: row.nama, warna: row.warna, icon: row.icon || '' })
  open.value = true
}

async function handleSubmit(event: FormSubmitEvent<any>) {
  emit('submit', { data: event.data, editing: editing.value })
  open.value = false
}

function handleClose() {
  open.value = false
  emit('close')
}

defineExpose({
  openCreate,
  openEdit
})
</script>

<template>
  <UModal v-model:open="open" :title="editing ? 'Edit Kategori' : 'Tambah Kategori'">
    <UButton icon="i-lucide-plus" label="Tambah Kategori" />

    <template #body>
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
            <UButton type="button" variant="ghost" @click="handleClose">Batal</UButton>
            <UButton type="submit">Simpan</UButton>
          </div>
        </template>
      </UForm>
    </template>
  </UModal>
</template>
