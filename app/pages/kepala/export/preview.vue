<template>
<UDashboardPanel id="kepala-export-preview">
  <template #header>
    <UDashboardNavbar title="Preview Laporan">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
      <template #right>
        <div class="flex gap-2">
          <UButton icon="i-lucide-printer" @click="window.print()">Print</UButton>
          <UButton variant="ghost" @click="navigateTo('/kepala/export')">Kembali</UButton>
        </div>
      </template>
    </UDashboardNavbar>
  </template>

  <template #body>
    <div class="print-area">
      <div class="text-center mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Laporan Aktivitas Harian</h2>
        <p class="text-sm text-gray-500 mt-1">
          {{ filterText }}
        </p>
        <p class="text-sm text-gray-500">Dicetak: {{ new Date().toLocaleString('id-ID') }}</p>
      </div>

      <UCard>
        <UTable :rows="activities" :columns="columns">
          <template #no-data="{ row }">
            <span class="text-center text-gray-500 py-4">Tidak ada data</span>
          </template>
        </UTable>
      </UCard>
    </div>
  </template>
</UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const activities = ref<any[]>([])
const filterText = ref('')

const columns = [
  { id: 'no', key: 'no', label: 'No' },
  { id: 'tanggal', key: 'tanggal', label: 'Tanggal' },
  { id: 'wilayah', key: 'wilayah', label: 'Wilayah' },
  { id: 'nama', key: 'nama', label: 'Nama' },
  { id: 'kategori', key: 'kategori', label: 'Kategori' },
  { id: 'jam_mulai', key: 'jam_mulai', label: 'Jam Mulai' },
  { id: 'jam_selesai', key: 'jam_selesai', label: 'Jam Selesai' },
  { id: 'deskripsi', key: 'deskripsi', label: 'Deskripsi' }
]

async function loadActivities() {
  const params: any = {}
  const route = useRoute()
  if (route.query.tanggal_dari) params.tanggal = String(route.query.tanggal_dari)
  if (route.query.region_id) params.region_id = String(route.query.region_id)
  if (route.query.kategori_id) params.kategori_id = String(route.query.kategori_id)

  const data = await $fetch('/api/activities', { params })
  activities.value = data.map((a: any, idx: number) => ({
    no: idx + 1,
    tanggal: a.tanggal,
    wilayah: a.region_nama,
    nama: a.user_nama,
    kategori: a.kategori_nama,
    jam_mulai: a.jam_mulai || '-',
    jam_selesai: a.jam_selesai || '-',
    deskripsi: a.deskripsi
  }))

  const parts: string[] = []
  if (route.query.tanggal_dari) parts.push(`Dari: ${route.query.tanggal_dari}`)
  if (route.query.tanggal_sampai) parts.push(`Sampai: ${route.query.tanggal_sampai}`)
  if (route.query.region_id) {
    const regions = await $fetch('/api/regions')
    const region = regions.find((r: any) => r.id === Number(route.query.region_id))
    if (region) parts.push(`Wilayah: ${region.nama}`)
  }
  if (route.query.kategori_id) {
    const categories = await $fetch('/api/categories')
    const category = categories.find((c: any) => c.id === Number(route.query.kategori_id))
    if (category) parts.push(`Kategori: ${category.nama}`)
  }
  filterText.value = parts.join(' | ')
}

onMounted(async () => {
  await loadActivities()
})
</script>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  .print-area, .print-area * {
    visibility: visible;
  }
  .print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .no-print {
    display: none !important;
  }
}
</style>
