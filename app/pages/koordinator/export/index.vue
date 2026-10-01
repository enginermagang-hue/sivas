<template>
<UDashboardPanel id="koordinator-export">
  <template #header>
    <UDashboardNavbar title="Export Laporan">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>
  </template>

  <template #body>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Export Laporan</h1>
    </div>

    <UCard>
      <UForm :state="form" @submit="handleExport">
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Dari Tanggal" name="tanggal_dari">
              <UInput v-model="form.tanggal_dari" type="date" />
            </UFormField>
            <UFormField label="Sampai Tanggal" name="tanggal_sampai">
              <UInput v-model="form.tanggal_sampai" type="date" />
            </UFormField>
          </div>
          <UFormField label="Kategori">
            <USelect
              v-model="form.kategori_id"
              :items="categories"
              value-key="id"
              label-key="nama"
              placeholder="Semua Kategori"
              clearable
            />
          </UFormField>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <UButton type="button" variant="ghost" @click="handlePreview">Preview PDF</UButton>
          <UButton type="submit" icon="i-lucide-download">Export Excel</UButton>
        </div>
      </UForm>
    </UCard>
  </template>
</UDashboardPanel>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { ref, reactive } from 'vue'

definePageMeta({
  layout: 'default'
})

const { user } = useAuth()
const categories = ref<any[]>([])

const form = reactive({
  tanggal_dari: '',
  tanggal_sampai: '',
  kategori_id: undefined as number | undefined
})

async function loadCategories() {
  categories.value = await $fetch('/api/categories')
}

async function handleExport() {
  try {
    const data = await $fetch('/api/export/excel', {
      method: 'POST',
      body: form
    })

    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-aktivitas-${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    URL.revokeObjectURL(url)

    alert('Excel berhasil diunduh')
  } catch (e: any) {
    alert(e?.statusMessage || 'Gagal export Excel')
  }
}

function handlePreview() {
  const params = new URLSearchParams()
  if (form.tanggal_dari) params.set('tanggal_dari', form.tanggal_dari)
  if (form.tanggal_sampai) params.set('tanggal_sampai', form.tanggal_sampai)
  if (form.kategori_id) params.set('kategori_id', String(form.kategori_id))
  const query = params.toString()
  navigateTo(`/koordinator/export/preview${query ? '?' + query : ''}`)
}

onMounted(async () => {
  await loadCategories()
})
</script>
