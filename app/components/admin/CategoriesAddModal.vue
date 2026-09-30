<template>
  <UModal v-model:open="open" :title="editing ? 'Edit Kategori' : 'Tambah Kategori'" :ui="{ footer: 'justify-end' }">
    <UButton label="Tambah Kategori" icon="i-lucide-plus" color="primary" />

    <template #body>
      <UForm
        id="category-form"
        :schema="schema"
        :state="form"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="space-y-4">
          <UFormField label="Nama Kategori" name="nama" required>
            <UInput v-model="form.nama" placeholder="Nama kategori" class="w-full" />
          </UFormField>

          <UFormField label="Warna" name="warna" required>
            <div class="flex items-center gap-2 w-full">
              <UInput v-model="form.warna" type="color" class="w-16 h-10 shrink-0" />
              <UInput v-model="form.warna" placeholder="#3B82F6" class="flex-1" />
            </div>
          </UFormField>

          <UFormField label="Icon" name="icon" hint="Opsional">
            <CategoryIconPicker v-model="form.icon" />
          </UFormField>

          <p v-if="message" :class="message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
            {{ message.text }}
          </p>
        </div>
      </UForm>
    </template>

    <template #footer>
      <UButton type="button" variant="ghost" :disabled="saving" @click="open = false">Batal</UButton>
      <UButton type="submit" form="category-form" :loading="saving" :disabled="saving">Simpan</UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { computed } from 'vue'
import { categoryCreateSchema, categoryUpdateSchema } from '../../../lib/validations'
import CategoryIconPicker from './CategoryIconPicker.vue'

const emit = defineEmits(['success'])
const toast = useToast()

const open = ref(false)
const editing = ref<any>(null)
const saving = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

type Schema = typeof categoryCreateSchema | typeof categoryUpdateSchema

const schema = computed(() => editing.value ? categoryUpdateSchema : categoryCreateSchema)

const form = reactive<Partial<Schema>>({
  nama: '',
  warna: '#3B82F6',
  icon: ''
})

watch(open, (isOpen) => {
  if (!isOpen) {
    editing.value = null
    Object.assign(form, { nama: '', warna: '#3B82F6', icon: '' })
    saving.value = false
    message.value = null
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

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  message.value = null
  try {
    const body = { ...event.data, icon: event.data.icon || null }
    if (editing.value) {
      await $fetch(`/api/categories/${editing.value.id}`, { method: 'PUT', body })
      message.value = { type: 'success', text: 'Kategori berhasil diperbarui' }
      toast.add({ color: 'success', title: 'Kategori berhasil diperbarui' })
    } else {
      await $fetch('/api/categories', { method: 'POST', body })
      message.value = { type: 'success', text: 'Kategori berhasil ditambahkan' }
      toast.add({ color: 'success', title: 'Kategori berhasil ditambahkan' })
    }
    open.value = false
    emit('success')
  } catch (e: any) {
    const msg = e?.data?.message || e?.statusMessage || e?.message || 'Gagal menyimpan'
    message.value = { type: 'error', text: msg }
    toast.add({ color: 'error', title: msg })
  } finally {
    saving.value = false
  }
}

defineExpose({ openEdit, close })
</script>
