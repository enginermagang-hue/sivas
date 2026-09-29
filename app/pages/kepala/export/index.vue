<template>
<UDashboardPanel id="kepala-export">
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
          <UFormField label="Wilayah">
            <USelect
              v-model="form.region_id"
              :options="regions"
              value-attribute="id"
              option-attribute="nama"
              placeholder="Semua Wilayah"
              clearable
            />
          </UFormField>
          <UFormField label="Kategori">
            <USelect
              v-model="form.kategori_id"
              :options="categories"
              value-attribute="id"
              option-attribute="nama"
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
definePageMeta({
  layout: 'default'
})

const toast = useToast()
const regions = ref<any[]>([])
const categories = ref<any[]>([])

const form = reactive({
  tanggal_dari: '',
  tanggal_sampai: '',
  region_id: undefined as number | undefined,
  kategori_id: undefined as number | undefined
})

async function loadRegions() {
  regions.value = await $fetch('/api/regions')
}

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

    toast.add({ color: 'success', title: 'Excel berhasil diunduh' })
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal export Excel' })
  }
}

function handlePreview() {
  const params = new URLSearchParams()
  if (form.tanggal_dari) params.set('tanggal_dari', form.tanggal_dari)
  if (form.tanggal_sampai) params.set('tanggal_sampai', form.tanggal_sampai)
  if (form.region_id) params.set('region_id', String(form.region_id))
  if (form.kategori_id) params.set('kategori_id', String(form.kategori_id))
  const query = params.toString()
  navigateTo(`/kepala/export/preview${query ? '?' + query : ''}`)
}

onMounted(async () => {
  await loadRegions()
  await loadCategories()
})
</script>
