<template>
  <UDashboardPanel id="export-pdf-preview">
    <template #header>
      <UDashboardNavbar title="Preview Laporan PDF">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex gap-2">
            <UButton
              icon="i-lucide-file-down"
              color="primary"
              variant="outline"
              :loading="pdfExporting"
              :disabled="loading || pdfExporting || !activities.length"
              @click="handleDownloadPdf"
            >
              Download PDF
            </UButton>
            <UButton
              variant="ghost"
              color="neutral"
              @click="handleBack"
            >
              Kembali
            </UButton>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full flex flex-col flex-1 space-y-3">
        <!-- Loading -->
        <div v-if="loading" class="rounded-lg border border-default p-8 text-center space-y-3">
          <UIcon name="i-lucide-loader-circle" class="w-6 h-6 animate-spin mx-auto text-muted" />
          <p class="text-sm text-muted">Menyiapkan preview PDF…</p>
          <p v-if="filterText" class="text-xs text-muted">{{ filterText }}</p>
        </div>

        <!-- Empty / error -->
        <UCard v-else-if="!activities.length">
          <div class="text-center py-8 space-y-2">
            <p class="text-sm font-medium text-highlighted">Tidak ada data untuk filter terpilih.</p>
            <p v-if="filterText" class="text-xs text-muted">{{ filterText }}</p>
            <UButton variant="soft" color="neutral" class="mt-2" @click="handleBack">Kembali ke Export</UButton>
          </div>
        </UCard>

        <!-- PDF iframe — fullwidth -->
        <div v-else class="flex-1 flex flex-col space-y-2 min-h-0">
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted px-1">
            <span>{{ filterText || 'Semua data — tanpa filter' }}</span>
            <span>{{ activities.length }} data • Dicetak: {{ currentTime }}</span>
          </div>
          <iframe
            v-if="pdfUrl"
            :src="pdfUrl"
            title="Preview PDF Laporan"
            class="w-full flex-1 min-h-[600px] h-[calc(100vh-140px)] rounded-lg border border-default bg-white shadow-sm"
          />
          <div v-else class="flex-1 flex flex-col items-center justify-center rounded-lg border border-default bg-white p-8 text-center min-h-[400px]">
            <UIcon name="i-lucide-loader-circle" class="w-6 h-6 animate-spin mx-auto text-muted" />
            <p class="text-sm text-muted mt-2">Merender PDF…</p>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { generateActivityPdfObjectUrl, downloadActivityPdf } from '~/utils/exportPdf'
import { formatDateShort } from '~/utils/date'

const route = useRoute()
const toast = useToast()
const { user } = useAuth()

const activities = ref<any[]>([])
const filterText = ref('')
const loading = ref(true)
const pdfExporting = ref(false)
const pdfUrl = ref<string | null>(null)
let objectUrl: string | null = null

const currentTime = computed(() => new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }))

function backPath() {
  const role = (user.value as any)?.role as string | undefined
  if (role === 'koordinator') return '/koordinator/export'
  if (role === 'anggota') return '/anggota/export'
  return '/'
}

function handleBack() {
  navigateTo(backPath())
}

function pdfColumnsForRole() {
  const role = (user.value as any)?.role as string | undefined
  if (role === 'koordinator' || role === 'kepala') {
    return [
      { header: 'No', dataKey: 'no' },
      { header: 'Tanggal', dataKey: 'tanggal' },
      { header: 'Kategori', dataKey: 'kategori' },
      { header: 'Nama', dataKey: 'nama' },
      { header: 'Mulai', dataKey: 'jam_mulai' },
      { header: 'Selesai', dataKey: 'jam_selesai' },
      { header: 'Deskripsi', dataKey: 'deskripsi' }
    ]
  }
  return [
    { header: 'No', dataKey: 'no' },
    { header: 'Tanggal', dataKey: 'tanggal' },
    { header: 'Kategori', dataKey: 'kategori' },
    { header: 'Nama', dataKey: 'nama' },
    { header: 'Mulai', dataKey: 'jam_mulai' },
    { header: 'Selesai', dataKey: 'jam_selesai' },
    { header: 'Deskripsi', dataKey: 'deskripsi' }
  ]
}



async function handleDownloadPdf() {
  if (!activities.value.length) {
    toast.add({ color: 'warning', title: 'Tidak ada data untuk di-export' })
    return
  }
  pdfExporting.value = true
  try {
    await downloadActivityPdf({
      filterText: filterText.value,
      rows: activities.value.map((r: any) => ({ ...r, tanggal: formatDateShort(r.tanggal) })),
      columns: pdfColumnsForRole()
    })
    toast.add({ color: 'success', title: 'PDF berhasil diunduh' })
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.message || 'Gagal export PDF' })
  } finally {
    pdfExporting.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    const q: any = route.query
    if (q.tanggal_dari) params.tanggal_dari = String(q.tanggal_dari)
    if (q.tanggal_sampai) params.tanggal_sampai = String(q.tanggal_sampai)
    if (q.kategori_id) params.kategori_id = String(q.kategori_id)
    // koordinator: allow anggota scope filter via query
    if (q.scope) params.scope = String(q.scope)
    if (q.anggota_id) params.anggota_id = String(q.anggota_id)
    // legacy: region_id from kepala export — still accepted by API for kepala viewing
    if (q.region_id) params.region_id = String(q.region_id)
    if (q.user_id) params.user_id = String(q.user_id)

    const data: any[] = await $fetch('/api/activities', { params })
    activities.value = data.map((a: any, idx: number) => ({
      no: idx + 1,
      tanggal: a.tanggal,
      kategori: a.kategori_nama || '-',
      nama: a.user_nama || '-',
      jam_mulai: a.jam_mulai || '-',
      jam_selesai: a.jam_selesai || '-',
      deskripsi: a.deskripsi || '-'
    }))

    const parts: string[] = []
    if (q.tanggal_dari) parts.push(`Dari: ${q.tanggal_dari}`)
    if (q.tanggal_sampai) parts.push(`Sampai: ${q.tanggal_sampai}`)
    const role = (user.value as any)?.role as string | undefined
    if (role === 'koordinator' && (user.value as any)?.nama) parts.push(`Koordinator: ${(user.value as any).nama}`)
    if (role === 'anggota' && (user.value as any)?.nama) parts.push(`Anggota: ${(user.value as any).nama}`)
    if (q.scope === 'self') parts.push('Lingkup: Aktivitas saya')
    else if (q.scope === 'wilayah') parts.push('Lingkup: Seluruh wilayah')
    if (q.kategori_id) {
      try {
        const categories: any[] = await $fetch('/api/categories')
        const cat = categories.find((c: any) => String(c.id) === String(q.kategori_id))
        if (cat) parts.push(`Kategori: ${cat.nama}`)
      } catch {}
    }
    filterText.value = parts.join('  \u2022  ')

    // Build PDF blob for iframe
    if (activities.value.length) {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
        objectUrl = null
      }
      const url = await generateActivityPdfObjectUrl({
        filterText: filterText.value,
        rows: activities.value.map((r: any) => ({ ...r, tanggal: formatDateShort(r.tanggal) })),
        columns: pdfColumnsForRole()
      })
      objectUrl = url
      pdfUrl.value = url
    }
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || e?.message || 'Gagal memuat data' })
  } finally {
    loading.value = false
  }
}

onMounted(load)

onBeforeUnmount(() => {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
})
</script>
