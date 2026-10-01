<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

const open = ref(false)
const editing = ref<any>(null)

const form = reactive({
  nama: '',
  kode: ''
})

const emit = defineEmits(['submit', 'close'])

function openCreate() {
  editing.value = null
  Object.assign(form, { nama: '', kode: '' })
  open.value = true
}

function openEdit(row: any) {
  editing.value = row
  Object.assign(form, { nama: row.nama, kode: row.kode })
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
  <UModal v-model:open="open" :title="editing ? 'Edit Wilayah' : 'Tambah Wilayah'">
    <UButton icon="i-lucide-plus" label="Tambah Wilayah" />

    <template #body>
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
            <UButton type="button" variant="ghost" @click="handleClose">Batal</UButton>
            <UButton type="submit">Simpan</UButton>
          </div>
        </template>
      </UForm>
    </template>
  </UModal>
</template>
