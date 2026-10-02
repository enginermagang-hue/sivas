<template>
<UDashboardPanel id="anggota-export">
  <template #header>
    <UDashboardNavbar title="Export Laporan">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>
  </template>

  <template #body>
    <div class="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 class="text-xl font-semibold text-highlighted">Export Laporan</h1>
        <p class="text-sm text-muted mt-1">Filter periode dan kategori untuk aktivitas Anda. Export ke Excel atau buka preview untuk cetak / simpan PDF.</p>
      </div>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2 text-sm font-semibold">
            <UIcon name="i-lucide-filter" class="w-4 h-4 text-muted" />
            Filter Laporan
          </div>
        </template>

        <UForm :state="form" @submit="handleExport">
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Dari Tanggal" name="tanggal_dari">
                <UInput v-model="form.tanggal_dari" type="date" class="w-full" />
              </UFormField>
              <UFormField label="Sampai Tanggal" name="tanggal_sampai">
                <UInput v-model="form.tanggal_sampai" type="date" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Kategori" description="Kosongkan untuk semua kategori">
              <USelect
                v-model="form.kategori_id"
                :items="categories"
                value-key="id"
                label-key="nama"
                placeholder="Semua Kategori"
                clearable
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="flex flex-wrap justify-end gap-2 mt-6">
            <UButton type="button" variant="ghost" color="neutral" icon="i-lucide-eye" :disabled="exporting || pdfExporting" @click="handlePreview">Preview</UButton>
            <UButton type="button" color="primary" variant="outline" icon="i-lucide-file-text" :loading="pdfExporting" :disabled="exporting || pdfExporting" @click="handleExportPdf">Export PDF</UButton>
            <UButton type="submit" color="primary" icon="i-lucide-download" :loading="exporting" :disabled="exporting || pdfExporting">Export Excel</UButton>
          </div>
          <p class="text-xs text-muted text-right mt-3">Export PDF via jsPDF (langsung di browser) • Preview untuk cetak browser.</p>
        </UForm>
      </UCard>
    </div>
  </template>
</UDashboardPanel>
</template>

<script setup lang="ts">
import { getLocalDateString } from '~/utils/date'
import { downloadActivityPdf } from '~/utils/exportPdf'

definePageMeta({
  layout: 'default'
})

const toast = useToast()
const categories = ref<any[]>([])
const exporting = ref(false)
const pdfExporting = ref(false)

const form = reactive({
  tanggal_dari: '',
  tanggal_sampai: '',
  kategori_id: undefined as number | undefined
})

async function loadCategories() {
  try {
    categories.value = await $fetch('/api/categories')
  } catch {
    categories.value = []
  }
}

async function handleExport() {
  exporting.value = true
  try {
    const data: any = await $fetch('/api/export/excel', {
      method: 'POST',
      body: form,
      responseType: 'blob' as any
    })

    const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-aktivitas-${getLocalDateString()}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    toast.add({ color: 'success', title: 'Excel berhasil diunduh' })
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || e?.message || 'Gagal export Excel' })
  } finally {
    exporting.value = false
  }
}

async function handleExportPdf() {
  pdfExporting.value = true
  try {
    const params: Record<string, string> = {}
    if (form.tanggal_dari) params.tanggal_dari = form.tanggal_dari
    if (form.tanggal_sampai) params.tanggal_sampai = form.tanggal_sampai
    if (form.kategori_id) params.kategori_id = String(form.kategori_id)

    const data: any[] = await $fetch('/api/activities', { params })
    const rows = data.map((a: any, idx: number) => ({
      no: idx + 1,
      tanggal: a.tanggal || '-',
      kategori: a.kategori_nama || '-',
      nama: a.user_nama || '-',
      jam_mulai: a.jam_mulai || '-',
      jam_selesai: a.jam_selesai || '-',
      deskripsi: a.deskripsi || '-'
    }))

    const parts: string[] = []
    if (form.tanggal_dari) parts.push(`Dari: ${form.tanggal_dari}`)
    if (form.tanggal_sampai) parts.push(`Sampai: ${form.tanggal_sampai}`)
    if (form.kategori_id) {
      const c = categories.value.find((x: any) => String(x.id) === String(form.kategori_id))
      if (c) parts.push(`Kategori: ${c.nama}`)
    }

    await downloadActivityPdf({
      filterText: parts.join('  \u2022  '),
      rows,
      columns: [
        { header: 'No', dataKey: 'no' },
        { header: 'Tanggal', dataKey: 'tanggal' },
        { header: 'Kategori', dataKey: 'kategori' },
        { header: 'Nama', dataKey: 'nama' },
        { header: 'Mulai', dataKey: 'jam_mulai' },
        { header: 'Selesai', dataKey: 'jam_selesai' },
        { header: 'Deskripsi', dataKey: 'deskripsi' }
      ]
    })
    toast.add({ color: 'success', title: 'PDF berhasil diunduh' })
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || e?.message || 'Gagal export PDF' })
  } finally {
    pdfExporting.value = false
  }
}

function handlePreview() {
  const params = new URLSearchParams()
  if (form.tanggal_dari) params.set('tanggal_dari', form.tanggal_dari)
  if (form.tanggal_sampai) params.set('tanggal_sampai', form.tanggal_sampai)
  if (form.kategori_id) params.set('kategori_id', String(form.kategori_id))
  const query = params.toString()
  navigateTo(`/anggota/export/preview${query ? '?' + query : ''}`)
}

onMounted(async () => {
  await loadCategories()
})
</script>
