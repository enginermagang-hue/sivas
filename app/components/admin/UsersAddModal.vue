<template>
  <UModal v-model:open="open" :title="editing ? 'Edit Pengguna' : 'Tambah Pengguna'" :ui="{ footer: 'justify-end' }">
    <UButton label="Tambah Pengguna" icon="i-lucide-plus" color="primary" />

    <template #body>
      <UForm
        ref="formEl"
        id="user-form"
        :schema="schema"
        :state="form"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="space-y-4">
          <UFormField label="Nama" name="nama" required>
            <UInput v-model="form.nama" placeholder="Nama lengkap" class="w-full" />
          </UFormField>

          <UFormField label="Email" name="email" required>
            <UInput v-model="form.email" type="email" placeholder="nama@example.com" class="w-full" />
          </UFormField>

          <UFormField label="Password" name="password" :required="!editing">
            <UInput
              v-model="form.password"
              type="password"
              :placeholder="editing ? 'Kosongkan jika tidak ingin mengubah' : 'Minimal 6 karakter'"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Role" name="role" required>
            <USelect v-model="form.role" :items="roleItems" placeholder="Pilih role" class="w-full" />
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
            <USelect v-model="form.status" :items="statusItems" class="w-full" />
          </UFormField>
        </div>
      </UForm>
    </template>

    <template #footer>
      <UButton type="button" variant="ghost" :disabled="saving" @click="open = false">Batal</UButton>
      <UButton type="button" :loading="saving" :disabled="saving" @click="formEl?.submit()">Simpan</UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { computed, ref, reactive, watch, onMounted } from 'vue'
import { userCreateSchema, userUpdateSchema } from '../../../lib/validations'

const emit = defineEmits(['success'])
const toast = useToast()

const open = ref(false)
const editing = ref<any>(null)
const saving = ref(false)
const formEl = useTemplateRef('formEl')
const regions = ref<any[]>([])
const users = ref<any[]>([])

type Schema = typeof userCreateSchema | typeof userUpdateSchema

const schema = computed(() => editing.value ? userUpdateSchema : userCreateSchema)

const form = reactive<Partial<Schema>>({
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

// Wilayah yang sudah punya koordinator (non-deleted, eksklusif user yang diedit)
const blockedRegionIds = computed(() => {
  if (form.role !== 'koordinator') return new Set<number>()
  const currentId = editing.value?.id as number | undefined
  const coords = users.value.filter(u => u.role === 'koordinator' && u.region_id != null && u.deleted_at == null)
  if (currentId) {
    const current = users.value.find(u => u.id === currentId)
    if (current?.region_id) coords.push(current)
  }
  return new Set(coords.map(u => Number(u.region_id)))
})

const regionItems = computed(() => {
  const blocked = blockedRegionIds.value
  return regions.value.map(r => {
    const isBlocked = blocked.has(Number(r.id))
    return {
      label: isBlocked ? `${r.nama} (sudah ada koordinator)` : r.nama,
      value: Number(r.id),
      disabled: isBlocked
    }
  })
})

async function fetchData() {
  try { regions.value = await $fetch('/api/regions') } catch { regions.value = [] }
  try { users.value = await $fetch('/api/users') } catch { users.value = [] }
}

watch(open, (isOpen) => {
  if (!isOpen) {
    editing.value = null
    Object.assign(form, { nama: '', email: '', password: '', role: 'anggota', region_id: undefined, status: 'active' })
    saving.value = false
    return
  }
  fetchData()
})

// Reset region_id jika role berubah ke koordinator tapi region terblokir
watch(() => form.role, (role) => {
  if (role === 'koordinator' && form.region_id != null && blockedRegionIds.value.has(Number(form.region_id))) {
    form.region_id = undefined
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
  fetchData()
}

function close() {
  open.value = false
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    const body = event.data
    if (editing.value) {
      await $fetch(`/api/users/${editing.value.id}`, { method: 'PUT', body })
      toast.add({ color: 'success', title: 'Pengguna berhasil diperbarui' })
    } else {
      await $fetch('/api/users', { method: 'POST', body })
      toast.add({ color: 'success', title: 'Pengguna berhasil ditambahkan' })
    }
    open.value = false
    emit('success')
  } catch (e: any) {
    const msg = e?.data?.message || e?.statusMessage || e?.message || 'Gagal menyimpan'
    toast.add({ color: 'error', title: msg })
  } finally {
    saving.value = false
  }
}

defineExpose({ openEdit, close })
</script>
