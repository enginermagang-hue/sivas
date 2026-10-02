<script setup lang="ts">
import { formatDateTime } from '~/utils/date'

definePageMeta({ layout: 'default' })

const { user } = useAuth()
const toast = useToast()

const kategori = ref<'saran' | 'bug' | 'pertanyaan' | 'lainnya'>('saran')
const pesan = ref('')
const rating = ref<number | null>(null)
const sending = ref(false)

const feedbacks = ref<any[]>([])
const loading = ref(true)

const kategoriItems = [
  { label: 'Saran', value: 'saran' },
  { label: 'Laporan Bug', value: 'bug' },
  { label: 'Pertanyaan', value: 'pertanyaan' },
  { label: 'Lainnya', value: 'lainnya' }
]

function statusLabel(s: string) {
  return s === 'resolved' ? 'Selesai' : s === 'read' ? 'Dibaca' : 'Belum dibaca'
}
function statusColor(s: string): any {
  return s === 'resolved' ? 'success' : s === 'read' ? 'info' : 'warning'
}
function kategoriLabel(k: string) {
  const m: Record<string, string> = { saran: 'Saran', bug: 'Bug', pertanyaan: 'Pertanyaan', lainnya: 'Lainnya' }
  return m[k] || k
}

async function load() {
  loading.value = true
  try {
    const res: any = await $fetch('/api/feedbacks')
    feedbacks.value = Array.isArray(res) ? res : []
  } catch {}
  loading.value = false
}

async function submit() {
  const t = pesan.value.trim()
  if (t.length < 3) {
    toast.add({ color: 'error', title: 'Pesan minimal 3 karakter' })
    return
  }
  sending.value = true
  try {
    await $fetch('/api/feedbacks', {
      method: 'POST',
      body: { kategori: kategori.value, pesan: t, rating: rating.value }
    })
    pesan.value = ''
    rating.value = null
    toast.add({ color: 'success', title: 'Masukan terkirim, terima kasih!' })
    await load()
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || e?.data?.statusMessage || 'Gagal mengirim' })
  } finally {
    sending.value = false
  }
}

onMounted(load)
</script>

<template>
  <UDashboardPanel id="feedback">
    <template #header>
      <UDashboardNavbar title="Feedback">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton v-if="user?.role === 'admin'" to="/admin/feedbacks" icon="i-lucide-shield" color="neutral" variant="soft">Kelola (Admin)</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-3xl mx-auto p-4 space-y-6">
        <!-- Form -->
        <UCard>
          <template #header>
            <h2 class="font-semibold">Kirim masukan</h2>
            <p class="text-sm text-muted">Saran, laporan kendala, atau pertanyaan — akan dibaca oleh admin.</p>
          </template>
          <div class="space-y-4">
            <UFormField label="Kategori">
              <USelect v-model="kategori" :items="kategoriItems" class="w-full" />
            </UFormField>
            <UFormField label="Kepuasan (opsional)">
              <div class="flex gap-1">
                <UButton
                  v-for="n in 5"
                  :key="n"
                  :variant="rating === n ? 'solid' : 'ghost'"
                  :color="rating === n ? 'warning' : 'neutral'"
                  icon="i-lucide-star"
                  size="sm"
                  @click="rating = rating === n ? null : n"
                >
                  {{ n }}
                </UButton>
              </div>
            </UFormField>
            <UFormField label="Pesan" required>
              <UTextarea v-model="pesan" placeholder="Tulis masukan Anda..." :rows="4" class="w-full" />
              <p class="text-xs text-muted mt-1">{{ pesan.trim().length }}/2000</p>
            </UFormField>
            <div class="flex justify-end">
              <UButton color="primary" :loading="sending" @click="submit">Kirim</UButton>
            </div>
          </div>
        </UCard>

        <!-- Riwayat -->
        <UCard>
          <template #header>
            <h2 class="font-semibold">Riwayat masukan saya</h2>
          </template>
          <div v-if="loading" class="flex justify-center py-6">
            <UIcon name="i-lucide-loader-circle" class="w-6 h-6 animate-spin text-muted" />
          </div>
          <div v-else-if="feedbacks.length === 0" class="text-sm text-muted py-4 text-center">Belum ada masukan.</div>
          <div v-else class="space-y-3">
            <div v-for="f in feedbacks" :key="f.id" class="rounded-lg border border-default p-3">
              <div class="flex flex-wrap gap-2 items-center mb-1">
                <UBadge color="neutral" variant="soft">{{ kategoriLabel(f.kategori) }}</UBadge>
                <UBadge :color="statusColor(f.status)" variant="soft">{{ statusLabel(f.status) }}</UBadge>
                <span v-if="f.rating" class="text-xs text-muted flex items-center gap-1"><UIcon name="i-lucide-star" class="w-3 h-3" /> {{ f.rating }}/5</span>
                <span class="text-xs text-muted ml-auto">{{ formatDateTime(f.created_at) }}</span>
              </div>
              <p class="text-sm whitespace-pre-wrap">{{ f.pesan }}</p>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
