<template>
  <UModal v-model:open="open" :title="editing ? 'Edit Wilayah' : 'Tambah Wilayah'" description="Kelola data wilayah dengan menambahkan atau mengedit nama dan kode wilayah." :ui="{ footer: 'justify-end' }">
    <UButton label="Tambah Wilayah" icon="i-lucide-plus" color="primary" />

    <template #body>
      <UForm
        id="region-form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="space-y-4">
          <UFormField label="Nama Wilayah" name="nama" required description="Nama resmi wilayah kerja" help="Contoh: Sivas Kota, Sivas Utara">
            <UInput v-model="state.nama" placeholder="Nama wilayah" class="w-full" />
          </UFormField>

          <UFormField label="Kode" name="kode" required hint="Unik" help="Kode singkat, contoh: SIV-01">
            <UInput v-model="state.kode" placeholder="contoh: SIV-01" class="w-full" />
          </UFormField>

          <UFormField label="Status" name="status" required>
            <USelect v-model="state.status" :items="statusItems" class="w-full" />
          </UFormField>

          <p v-if="message" :class="message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
            {{ message.text }}
          </p>
        </div>
      </UForm>
    </template>

    <template #footer>
      <UButton type="button" variant="ghost" :disabled="saving" @click="open = false">Batal</UButton>
      <UButton type="submit" form="region-form" :loading="saving" :disabled="saving">Simpan</UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { computed } from 'vue'
import { regionCreateSchema, regionUpdateSchema } from '../../../lib/validations'

const statusItems = [
  { label: 'Aktif', value: 'active' },
  { label: 'Nonaktif', value: 'inactive' }
]

const emit = defineEmits(['success'])
const toast = useToast()

const open = ref(false)
const editing = ref<any>(null)
const saving = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

type Schema = typeof regionCreateSchema | typeof regionUpdateSchema

const schema = computed(() => editing.value ? regionUpdateSchema : regionCreateSchema)

const state = reactive<Partial<Schema>>({
  nama: '',
  kode: '',
  status: 'active'
})

watch(open, (isOpen) => {
  if (!isOpen) {
    editing.value = null
    Object.assign(state, { nama: '', kode: '', status: 'active' })
    saving.value = false
    message.value = null
  }
})

function openEdit(row: any) {
  editing.value = row
  Object.assign(state, { nama: row.nama, kode: row.kode, status: row.status ?? 'active' })
  open.value = true
}

defineExpose({ openEdit })

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  message.value = null
  try {
    const body = event.data
    if (editing.value) {
      await $fetch(`/api/regions/${editing.value.id}`, { method: 'PUT', body })
      message.value = { type: 'success', text: 'Wilayah berhasil diperbarui' }
      toast.add({ color: 'success', title: 'Wilayah berhasil diperbarui' })
    } else {
      await $fetch('/api/regions', { method: 'POST', body })
      message.value = { type: 'success', text: 'Wilayah berhasil ditambahkan' }
      toast.add({ color: 'success', title: 'Wilayah berhasil ditambahkan' })
    }
    open.value = false
    emit('success')
  } catch (e: any) {
    const errMsg = e?.data?.message || e?.statusMessage || e?.message || 'Gagal menyimpan'
    message.value = { type: 'error', text: errMsg }
    toast.add({ color: 'error', title: errMsg })
  } finally {
    saving.value = false
  }
}
</script>
